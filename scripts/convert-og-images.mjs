/**
 * Build-time script: Convert WebP/AVIF images to JPEG for OG (Open Graph) compatibility.
 * 
 * WhatsApp and some social media crawlers don't support WebP/AVIF for OG previews.
 * This script creates JPEG copies (with _og.jpg suffix) of all WebP/AVIF files
 * in public/uploads/ so they can be used as og:image sources.
 * 
 * Runs automatically before `astro build` via package.json build script.
 */

import sharp from 'sharp';
import { readdirSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = join(__dirname, '..', 'public', 'uploads');

// Formats that need conversion for OG compatibility
const INCOMPATIBLE_FORMATS = ['.webp', '.avif'];

async function convertImages() {
  console.log('🖼️  Converting WebP/AVIF images to JPEG for OG compatibility...');

  if (!existsSync(UPLOADS_DIR)) {
    console.log('⚠️  No uploads directory found, skipping.');
    return;
  }

  const files = readdirSync(UPLOADS_DIR);
  const toConvert = files.filter(f => {
    const ext = extname(f).toLowerCase();
    return INCOMPATIBLE_FORMATS.includes(ext);
  });

  if (toConvert.length === 0) {
    console.log('✅ No WebP/AVIF images found, nothing to convert.');
    return;
  }

  let converted = 0;
  let skipped = 0;

  for (const file of toConvert) {
    const inputPath = join(UPLOADS_DIR, file);
    // Replace extension with _og.jpg (e.g., image.webp → image_og.jpg)
    const baseName = basename(file, extname(file));
    const outputPath = join(UPLOADS_DIR, `${baseName}_og.jpg`);

    // Skip if JPEG version already exists
    if (existsSync(outputPath)) {
      skipped++;
      continue;
    }

    try {
      await sharp(inputPath)
        .jpeg({ quality: 85, progressive: true })
        .resize(1200, 630, { fit: 'cover', position: 'center' })
        .toFile(outputPath);
      converted++;
      console.log(`  ✅ ${file} → ${baseName}_og.jpg`);
    } catch (err) {
      console.error(`  ❌ Failed to convert ${file}:`, err.message);
    }
  }

  console.log(`\n📊 OG Image Conversion Complete:`);
  console.log(`   Converted: ${converted}`);
  console.log(`   Skipped (already exists): ${skipped}`);
  console.log(`   Total WebP/AVIF files: ${toConvert.length}`);
}

convertImages().catch(err => {
  console.error('❌ OG image conversion failed:', err);
  // Don't fail the build — OG images are nice-to-have
  process.exit(0);
});
