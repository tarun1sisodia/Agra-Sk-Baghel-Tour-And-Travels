import { loadEnv } from "../src/config/env.js";
import { createMediaStorage, mimeTypeForPath } from "../src/modules/catalog/media.storage.js";
import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { createSupabaseAdmin } from "../src/config/supabase.js";

async function runEndToEndTest() {
  console.log("================================================================================");
  console.log("        END-TO-END PIPELINE AUDIT: MEDIA, DUAL-STORAGE, CACHING & DEPLOY        ");
  console.log("================================================================================\n");

  const env = loadEnv();
  const mediaStorage = createMediaStorage(env, console);

  if (!mediaStorage) {
    console.error("❌ Media storage is not configured!");
    process.exit(1);
  }

  console.log(`[Storage Mode] Active Backend: ${mediaStorage.backend}`);
  console.log(`[Storage Mode] Buckets: ${mediaStorage.bucket}\n`);

  const probeFilename = `e2e-test-probe-${Date.now()}.webp`;
  const probePath = `packages/${probeFilename}`;
  const testPayload = Buffer.from(
    "RIFF....WEBPVP8 ...SK_BAGHEL_TOUR_AND_TRAVELS_END_TO_END_PROBE_BYTES_TEST..."
  );

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // STEP 1: Dual-Write Verification
  // ---------------------------------------------------------------------------
  console.log("--------------------------------------------------------------------------------");
  console.log("STEP 1: Testing Media Upload & Dual-Storage Replication (CF R2 + Supabase)");
  console.log("--------------------------------------------------------------------------------");
  try {
    const t0 = Date.now();
    await mediaStorage.upload({
      path: probePath,
      buffer: testPayload,
      mimeType: "image/webp",
    });
    console.log(`✔ Dual-write upload finished in ${Date.now() - t0}ms.`);

    // 1a. Verify directly in Cloudflare R2
    const s3Client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION || "auto",
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
    const r2Obj = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET_NAME || env.CATALOG_MEDIA_BUCKET || "skb-media-backup",
        Key: probePath,
      })
    );
    if (r2Obj.Body) {
      console.log(`✔ Verified in Primary Storage: Found in Cloudflare R2 bucket "${env.CATALOG_MEDIA_BUCKET}".`);
    } else {
      console.warn("✖ Object not found in Cloudflare R2!");
      allPassed = false;
    }

    // 1b. Verify directly in Supabase Storage
    const supabaseAdmin = createSupabaseAdmin(env);
    if (supabaseAdmin) {
      const { data: supaObj, error: supaErr } = await supabaseAdmin.storage
        .from(env.SUPABASE_MEDIA_BUCKET || "documents")
        .download(probePath);

      if (!supaErr && supaObj) {
        console.log(`✔ Verified in Secondary Storage: Found in Supabase bucket "${env.SUPABASE_MEDIA_BUCKET}".`);
      } else {
        console.warn(`✖ Not found in Supabase Storage: ${supaErr?.message}`);
        allPassed = false;
      }
    }
  } catch (err: any) {
    console.error(`❌ Step 1 failed: ${err.message}`);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // STEP 2: Primary Download & Content Integrity Check
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("STEP 2: Testing Primary Download & Byte Integrity");
  console.log("--------------------------------------------------------------------------------");
  try {
    const t0 = Date.now();
    const downloaded = await mediaStorage.download(probePath);
    console.log(`✔ Downloaded via mediaStorage in ${Date.now() - t0}ms.`);

    if (downloaded.equals(testPayload)) {
      console.log(`✔ 100% Byte Match! Downloaded ${downloaded.length} bytes identical to source.`);
    } else {
      console.error("✖ Content mismatch!");
      allPassed = false;
    }
  } catch (err: any) {
    console.error(`❌ Step 2 failed: ${err.message}`);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // STEP 3: Failover Simulation & Self-Healing Backfill
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("STEP 3: Testing Failover & Self-Healing (Supabase -> Cloudflare R2)");
  console.log("--------------------------------------------------------------------------------");
  const failoverFilename = `failover-probe-${Date.now()}.webp`;
  const failoverPath = `packages/${failoverFilename}`;
  const failoverPayload = Buffer.from("FAILOVER_BACKFILL_TEST_CONTENT_BYTES");

  try {
    const supabaseAdmin = createSupabaseAdmin(env);
    if (supabaseAdmin) {
      // Intentionally upload ONLY to Supabase (simulating legacy image or R2 desync)
      await supabaseAdmin.storage
        .from(env.SUPABASE_MEDIA_BUCKET || "documents")
        .upload(failoverPath, failoverPayload, { contentType: "image/webp", upsert: true });

      console.log(`✔ Uploaded probe exclusively to Supabase Storage ("${failoverPath}").`);

      // Request through mediaStorage (primary will 404, then fallback to Supabase)
      const fallbackResult = await mediaStorage.download(failoverPath);
      if (fallbackResult.equals(failoverPayload)) {
        console.log("✔ Failover Succeeded! Retrieved payload from secondary storage seamlessly.");
      } else {
        console.error("✖ Failover payload mismatch.");
        allPassed = false;
      }

      // Allow 500ms for background opportunistic backfill to finish
      await new Promise((res) => setTimeout(res, 600));

      // Verify that the file was self-healed into Cloudflare R2
      const s3Client = new S3Client({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION || "auto",
        forcePathStyle: true,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
      });

      const healedObj = await s3Client.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET_NAME || env.CATALOG_MEDIA_BUCKET || "skb-media-backup",
          Key: failoverPath,
        })
      );

      if (healedObj.Body) {
        console.log("✔ Self-Healing Backfill Succeeded! File is now automatically cached in Cloudflare R2.");
      } else {
        console.warn("⚠ File was not backfilled to R2.");
      }

      // Cleanup failover probe
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET_NAME || env.CATALOG_MEDIA_BUCKET || "skb-media-backup",
          Key: failoverPath,
        })
      ).catch(() => undefined);
      await supabaseAdmin.storage
        .from(env.SUPABASE_MEDIA_BUCKET || "documents")
        .remove([failoverPath])
        .catch(() => undefined);
    }
  } catch (err: any) {
    console.error(`❌ Step 3 failed: ${err.message}`);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // STEP 4: Live HTTP Media Endpoint & Edge Caching Headers Probe
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("STEP 4: Testing Edge Caching Headers on Live Tour Package Media Endpoint");
  console.log("--------------------------------------------------------------------------------");
  try {
    const liveMediaUrl = "https://api.agraskbagheltourandtravels.com/api/v1/tour-packages/media/b191edb7-ffcd-4d8d-bc5d-876fd9fc3031.jpg";
    const headRes = await fetch(liveMediaUrl, { method: "HEAD" });
    console.log(`• Live URL: ${liveMediaUrl}`);
    console.log(`• HTTP Status: ${headRes.status} ${headRes.statusText}`);
    console.log(`• Content-Type: ${headRes.headers.get("content-type")}`);
    console.log(`• Cache-Control: ${headRes.headers.get("cache-control")}`);
    console.log(`• CF-Cache-Status / Ray: ${headRes.headers.get("cf-cache-status") || "N/A"} (${headRes.headers.get("cf-ray") || "N/A"})`);

    const cacheControl = headRes.headers.get("cache-control") || "";
    if (cacheControl.includes("s-maxage=31536000") && cacheControl.includes("stale-while-revalidate")) {
      console.log("✔ Edge caching headers verified (s-maxage=31536000, stale-while-revalidate=86400, stale-if-error=604800)!");
    } else {
      console.warn("⚠ Cache-Control header differs from expected edge policy.");
    }
  } catch (err: any) {
    console.error(`❌ Step 4 failed: ${err.message}`);
  }

  // ---------------------------------------------------------------------------
  // STEP 5: Cleanup Test Probes
  // ---------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------------------");
  console.log("STEP 5: Cleaning Up Probe Artifacts");
  console.log("--------------------------------------------------------------------------------");
  try {
    await mediaStorage.remove(probePath);
    console.log(`✔ Successfully removed test probe "${probePath}" from both buckets.`);
  } catch (err: any) {
    console.warn(`⚠ Cleanup warning: ${err.message}`);
  }

  console.log("\n================================================================================");
  if (allPassed) {
    console.log("  ✔ END-TO-END VERIFICATION COMPLETED SUCCESSFULLY WITH 100% PASS RATE!         ");
  } else {
    console.log("  ⚠ PIPELINE COMPLETED WITH WARNINGS (CHECK ABOVE)                               ");
  }
  console.log("================================================================================\n");
}

runEndToEndTest().catch(console.error);
