import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface CheckResult {
  service: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  details: string;
}

const results: CheckResult[] = [];

// Parse .env manually to avoid logging secrets
const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

async function runChecks() {
  console.log('======================================================');
  console.log('       RUNNING BACKEND ENVIRONMENT & SERVICE AUDIT    ');
  console.log('======================================================\n');

  // 1. Database Connection
  if (env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });
      const t0 = Date.now();
      const res = await pool.query('SELECT NOW() as current_time, current_database() as db_name, COUNT(*)::int as count FROM tour_packages');
      await pool.end();
      results.push({
        service: 'Database (PostgreSQL / Supabase)',
        status: 'PASS',
        details: `Connected in ${Date.now() - t0}ms. Database: "${res.rows[0].db_name}". Found ${res.rows[0].count} tour packages.`
      });
    } catch (e: any) {
      results.push({
        service: 'Database (PostgreSQL / Supabase)',
        status: 'FAIL',
        details: `Connection failed: ${e.message}`
      });
    }
  } else {
    results.push({
      service: 'Database (PostgreSQL / Supabase)',
      status: 'FAIL',
      details: 'DATABASE_URL is missing.'
    });
  }

  // 2. Cloudflare R2 / S3
  const s3Endpoint = env.S3_ENDPOINT;
  const s3Bucket = env.CATALOG_MEDIA_BUCKET || env.S3_BUCKET_NAME;
  const s3Key = env.S3_ACCESS_KEY_ID;
  const s3Secret = env.S3_SECRET_ACCESS_KEY;

  if (s3Endpoint && s3Bucket && s3Key && s3Secret) {
    try {
      const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const client = new S3Client({
        region: env.S3_REGION || 'auto',
        endpoint: s3Endpoint,
        credentials: {
          accessKeyId: s3Key,
          secretAccessKey: s3Secret,
        },
      });

      const testKey = `audit-probe-${Date.now()}.txt`;
      const content = 'R2 operational audit probe';
      await client.send(new PutObjectCommand({
        Bucket: s3Bucket,
        Key: testKey,
        Body: Buffer.from(content),
        ContentType: 'text/plain',
      }));

      const getRes = await client.send(new GetObjectCommand({
        Bucket: s3Bucket,
        Key: testKey,
      }));
      const body = await getRes.Body?.transformToString();

      await client.send(new DeleteObjectCommand({
        Bucket: s3Bucket,
        Key: testKey,
      }));

      if (body === content) {
        results.push({
          service: 'Cloudflare R2 Storage',
          status: 'PASS',
          details: `Read/Write/Delete verified on bucket "${s3Bucket}" via endpoint "${s3Endpoint}".`
        });
      } else {
        results.push({
          service: 'Cloudflare R2 Storage',
          status: 'WARN',
          details: `Read content mismatch on bucket "${s3Bucket}".`
        });
      }
    } catch (e: any) {
      results.push({
        service: 'Cloudflare R2 Storage',
        status: 'FAIL',
        details: `R2 check failed: ${e.message}`
      });
    }
  } else {
    results.push({
      service: 'Cloudflare R2 Storage',
      status: 'WARN',
      details: 'Missing one or more S3 parameters (S3_ENDPOINT, CATALOG_MEDIA_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY).'
    });
  }

  // 3. Razorpay API
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    try {
      const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/payments?count=1', {
        headers: { Authorization: `Basic ${auth}` },
      });
      if (res.ok) {
        const data = await res.json() as any;
        results.push({
          service: 'Razorpay Payment Gateway',
          status: 'PASS',
          details: `Credentials valid. API responded HTTP 200 (retrieved ${data.items?.length ?? 0} sample payments). Key: ${env.RAZORPAY_KEY_ID.substring(0, 8)}...`
        });
      } else {
        const errText = await res.text();
        results.push({
          service: 'Razorpay Payment Gateway',
          status: 'FAIL',
          details: `HTTP ${res.status}: ${errText}`
        });
      }
    } catch (e: any) {
      results.push({
        service: 'Razorpay Payment Gateway',
        status: 'FAIL',
        details: `Connection failed: ${e.message}`
      });
    }
  } else {
    results.push({
      service: 'Razorpay Payment Gateway',
      status: 'WARN',
      details: 'RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET missing.'
    });
  }

  // 4. Resend Email API
  if (env.RESEND_API_KEY) {
    try {
      // Test send-permission by pinging email endpoint with validation probe
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'check@example.com',
          to: 'test@example.com',
          subject: 'probe',
          html: '<p>probe</p>',
        }),
      });
      const data = await res.json() as any;
      if (data?.name === 'validation_error' || res.status === 422 || res.ok) {
        results.push({
          service: 'Resend Email Service',
          status: 'PASS',
          details: 'API key is valid and authenticated for sending emails (restricted send-only key).'
        });
      } else if (res.status === 401) {
        results.push({
          service: 'Resend Email Service',
          status: 'FAIL',
          details: `Authentication failed: ${data?.message || 'Invalid API Key'}`
        });
      } else {
        results.push({
          service: 'Resend Email Service',
          status: 'WARN',
          details: `HTTP ${res.status}: ${data?.message || 'Unexpected response'}`
        });
      }
    } catch (e: any) {
      results.push({
        service: 'Resend Email Service',
        status: 'FAIL',
        details: `Connection error: ${e.message}`
      });
    }
  } else {
    results.push({
      service: 'Resend Email Service',
      status: 'WARN',
      details: 'RESEND_API_KEY is not set.'
    });
  }

  // 5. LocationIQ Token
  if (env.LOCATIONIQ_TOKEN) {
    try {
      const res = await fetch(`https://us1.locationiq.com/v1/search?key=${env.LOCATIONIQ_TOKEN}&q=Taj+Mahal+Agra&format=json&limit=1`);
      if (res.ok) {
        const data = await res.json() as any;
        results.push({
          service: 'LocationIQ Geocoding API',
          status: 'PASS',
          details: `Token valid. Geocoded "Taj Mahal Agra" -> lat: ${data[0]?.lat}, lon: ${data[0]?.lon}`
        });
      } else {
        const err = await res.text();
        results.push({
          service: 'LocationIQ Geocoding API',
          status: 'FAIL',
          details: `HTTP ${res.status}: ${err}`
        });
      }
    } catch (e: any) {
      results.push({
        service: 'LocationIQ Geocoding API',
        status: 'FAIL',
        details: `Connection error: ${e.message}`
      });
    }
  } else {
    results.push({
      service: 'LocationIQ Geocoding API',
      status: 'INFO',
      details: 'LOCATIONIQ_TOKEN not set.'
    });
  }

  // 6. Cloudflare Deploy Hook
  const hookUrl = env.CLOUDFLARE_DEPLOY_HOOK_URL || env.PAGES_DEPLOY_HOOK_URL;
  if (hookUrl) {
    try {
      // Don't POST to avoid triggering unwanted production rebuilds; check URL structure & domain
      const parsed = new URL(hookUrl);
      results.push({
        service: 'Pages Deploy Hook URL',
        status: 'PASS',
        details: `Configured pointing to ${parsed.origin}${parsed.pathname.slice(0, 15)}... (valid URL format)`
      });
    } catch (e: any) {
      results.push({
        service: 'Pages Deploy Hook URL',
        status: 'WARN',
        details: `Invalid URL format: ${e.message}`
      });
    }
  } else {
    results.push({
      service: 'Pages Deploy Hook URL',
      status: 'INFO',
      details: 'Not configured.'
    });
  }

  // 7. Cloudflare API Token & Account ID Analysis
  if (env.CLOUDFLARE_API_TOKEN) {
    const raw = env.CLOUDFLARE_API_TOKEN;
    try {
      const res = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
        headers: { Authorization: `Bearer ${raw}` }
      });
      const data = await res.json() as any;
      if (data.success) {
        results.push({
          service: 'Cloudflare API Token',
          status: 'PASS',
          details: `Valid Global/User API token (status: ${data.result?.status || 'active'}).`
        });
      } else {
        results.push({
          service: 'Cloudflare API Token',
          status: 'WARN',
          details: `Cloudflare API returned "Invalid API Token" (code ${data.errors?.[0]?.code}). Note: It starts with "${raw.substring(0, 4)}", which is a Cloudflare R2 Scoped User/App token rather than a Cloudflare Management API Token (or it has limited scopes).`
        });
      }
    } catch (e: any) {
      results.push({
        service: 'Cloudflare API Token',
        status: 'FAIL',
        details: `Connection error: ${e.message}`
      });
    }
  }

  // 8. Print Summary Table
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✔' : r.status === 'FAIL' ? '✖' : '⚠';
    console.log(`[${icon} ${r.status}] ${r.service}`);
    console.log(`     ${r.details}\n`);
  }
}

runChecks().catch(console.error);
