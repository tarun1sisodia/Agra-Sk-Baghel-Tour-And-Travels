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
  console.log('=== Checking Cloudflare R2 bucket: ' + env.CATALOG_MEDIA_BUCKET + ' ===');
  const s3 = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  try {
    const r2Res = await s3.send(new ListObjectsV2Command({
      Bucket: env.CATALOG_MEDIA_BUCKET,
    }));
    console.log('R2 total objects:', r2Res.KeyCount);
    r2Res.Contents?.forEach(c => console.log(' - ' + c.Key + ' (' + c.Size + ' bytes)'));
  } catch (err: any) {
    console.error('R2 error:', err.message);
  }

  console.log('\n=== Checking Supabase Storage bucket: ' + env.SUPABASE_MEDIA_BUCKET + ' ===');
  try {
    const supaRes = await fetch(env.SUPABASE_URL + '/storage/v1/object/list/' + env.SUPABASE_MEDIA_BUCKET, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix: '', limit: 100 }),
    });
    const data = await supaRes.json() as any;
    console.log('Supabase items at root:', Array.isArray(data) ? data.map((d: any) => d.name) : data);

    const supaPkgRes = await fetch(env.SUPABASE_URL + '/storage/v1/object/list/' + env.SUPABASE_MEDIA_BUCKET, {
      method: 'POST',
      headers: {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY,
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

run().catch(console.error);
