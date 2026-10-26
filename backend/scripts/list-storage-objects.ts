import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envFile = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
}

async function run() {
  const s3Endpoint = env.S3_ENDPOINT;
  const s3AccessKeyId = env.S3_ACCESS_KEY_ID;
  const s3SecretAccessKey = env.S3_SECRET_ACCESS_KEY;
  const r2Bucket = env.CATALOG_MEDIA_BUCKET;

  console.log('=== Checking Cloudflare R2 bucket: ' + (r2Bucket || '[NOT CONFIGURED]') + ' ===');
  if (!s3AccessKeyId || !s3SecretAccessKey || !r2Bucket) {
    console.warn('Skipping R2 check: Missing S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, or CATALOG_MEDIA_BUCKET in .env');
  } else {
    const s3 = new S3Client({
      endpoint: s3Endpoint,
      region: env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
      },
    });

    try {
      const r2Res = await s3.send(new ListObjectsV2Command({
        Bucket: r2Bucket,
      }));
      console.log('R2 total objects:', r2Res.KeyCount);
      r2Res.Contents?.forEach(c => console.log(' - ' + c.Key + ' (' + c.Size + ' bytes)'));
    } catch (err: any) {
      console.error('R2 error:', err.message);
    }
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseBucket = env.SUPABASE_MEDIA_BUCKET;

  console.log('\n=== Checking Supabase Storage bucket: ' + (supabaseBucket || '[NOT CONFIGURED]') + ' ===');
  if (!supabaseUrl || !supabaseKey || !supabaseBucket) {
    console.warn('Skipping Supabase check: Missing SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or SUPABASE_MEDIA_BUCKET in .env');
  } else {
    try {
      const supaRes = await fetch(supabaseUrl + '/storage/v1/object/list/' + supabaseBucket, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix: '', limit: 100 }),
      });
      const data = await supaRes.json() as any;
      console.log('Supabase items at root:', Array.isArray(data) ? data.map((d: any) => d.name) : data);

      const supaPkgRes = await fetch(supabaseUrl + '/storage/v1/object/list/' + supabaseBucket, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': 'Bearer ' + supabaseKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prefix: 'packages', limit: 100 }),
      });
      const pkgData = await supaPkgRes.json() as any;
      console.log('Supabase items in packages/:', Array.isArray(pkgData) ? pkgData.map((d: any) => d.name) : pkgData);
    } catch (err: any) {
      console.error('Supabase error:', err.message);
    }
  }
}

run().catch(console.error);
