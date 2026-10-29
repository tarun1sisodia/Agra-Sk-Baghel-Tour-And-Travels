import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

async function optimize() {
  const images = [
    {
      file: 'react/public/assets/booking/taj-mahal-480.avif',
      quality: 50,
    },
    {
      file: 'react/public/assets/home-hero/taj-mahal-agra-960.avif',
      quality: 52,
    },
  ];

  for (const item of images) {
    const fullPath = path.resolve(item.file);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping non-existent ${item.file}`);
      continue;
    }
    const originalSize = fs.statSync(fullPath).size;
    const inputBuf = fs.readFileSync(fullPath);
    const optimizedBuf = await sharp(inputBuf)
      .avif({ quality: item.quality, effort: 8 })
      .toBuffer();
    
    if (optimizedBuf.length < originalSize) {
      fs.writeFileSync(fullPath, optimizedBuf);
      console.log(`✅ Optimized ${item.file}: ${(originalSize / 1024).toFixed(1)} KB -> ${(optimizedBuf.length / 1024).toFixed(1)} KB (${Math.round((1 - optimizedBuf.length / originalSize) * 100)}% savings)`);
    } else {
      console.log(`⚠️ Original was already smaller for ${item.file}`);
    }
  }
}

optimize().catch(console.error);
