import { loadEnv } from "../src/config/env.js";
import { createMediaStorage } from "../src/modules/catalog/media.storage.js";

async function verifyR2() {
  console.log("=================================================");
  console.log(" VERIFYING CLOUDFLARE R2 BUCKET & CREDENTIALS");
  console.log("=================================================");

  const env = loadEnv();

  console.log("• S3_ENDPOINT           :", env.S3_ENDPOINT);
  console.log("• S3_REGION             :", env.S3_REGION);
  console.log("• CATALOG_MEDIA_BUCKET  :", env.CATALOG_MEDIA_BUCKET);
  console.log("• S3_ACCESS_KEY_ID      :", env.S3_ACCESS_KEY_ID ? `Present (${env.S3_ACCESS_KEY_ID.length} chars, starts with ${env.S3_ACCESS_KEY_ID.slice(0, 4)}...)` : "[MISSING]");
  console.log("• S3_SECRET_ACCESS_KEY  :", env.S3_SECRET_ACCESS_KEY ? `Present (${env.S3_SECRET_ACCESS_KEY.length} chars)` : "[MISSING]");

  const storage = createMediaStorage(env);
  if (!storage) {
    throw new Error("createMediaStorage returned null!");
  }

  console.log(`\n• Media Storage Active Backend: ${storage.backend.toUpperCase()}`);
  console.log(`• Active Storage Bucket       : ${storage.bucket}`);

  const testKey = `health-check/r2-probe-${Date.now()}.txt`;
  const testPayload = `Agra SK Baghel Tour & Travels R2 Health Probe at ${new Date().toISOString()}`;
  const testBuffer = Buffer.from(testPayload, "utf-8");

  console.log(`\n1. Testing R2 PutObject via createMediaStorage...`);
  const t0 = Date.now();
  await storage.upload({
    path: testKey,
    buffer: testBuffer,
    mimeType: "text/plain",
  });
  console.log(`   ✔ Upload Succeeded in ${Date.now() - t0}ms!`);

  console.log(`\n2. Testing R2 GetObject via createMediaStorage...`);
  const t1 = Date.now();
  const downloaded = await storage.download(testKey);
  const downloadedText = downloaded.toString("utf-8");
  if (downloadedText !== testPayload) {
    throw new Error(`Data corruption: downloaded payload does not match uploaded buffer!`);
  }
  console.log(`   ✔ Download Succeeded in ${Date.now() - t1}ms!`);
  console.log(`   ✔ Content Integrity Verified (100% byte match: ${downloaded.length} bytes).`);

  console.log(`\n3. Cleaning up test probe object from R2...`);
  await storage.remove(testKey);
  console.log(`   ✔ Test object successfully cleaned up.`);

  console.log("\n=================================================");
  console.log(` ✔ CLOUDFLARE R2 IS FULLY INTEGRATED & OPERATIONAL!`);
  console.log("=================================================\n");
}

verifyR2().catch((err) => {
  console.error("\n[✖] R2 Connectivity Verification Failed:");
  console.error(err.message || err);
  process.exit(1);
});
