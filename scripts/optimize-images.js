/*
 * Generate web-optimized .webp versions of the images in public/images.
 * Originals are left untouched (kept as source / fallback).
 *
 *   npm run images
 *
 * Sizing is based on how large each image is actually displayed (with some
 * headroom for high-DPI screens). Quality 80 is a good size/quality balance.
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const IMG_DIR = path.join(__dirname, '..', 'public', 'images');
const QUALITY = 80;

// Longest-edge cap (px) per image. Default applies to anything not listed.
const DEFAULT_MAX_EDGE = 1600;
const MAX_EDGE = {
  // Product / hero bottles — never shown wider than ~420px, so ~1000px covers 2x.
  'bottle.png': 1000,
  'bottle-gin.png': 1000,
  'bottle-limoncello.png': 1000,
  'bottle-vodka.png': 1000,
  'bottle-old.png': 1000,
  'v3-bottle.png': 1000,
  // Logos — only ever shown at <=48px.
  'logo.png': 400,
  'logo-white.png': 400,
  // Legal label graphic — small, keep crisp.
  'pregnancy-warning.png': 600,
};

const RASTER = /\.(png|jpe?g)$/i;

// Tiny flat PNGs (logos) compress smaller as PNG than WebP — keep them as-is.
const SKIP = new Set(['logo.png', 'logo-white.png']);

async function run() {
  const files = fs.readdirSync(IMG_DIR).filter((f) => RASTER.test(f) && !SKIP.has(f));
  let beforeTotal = 0;
  let afterTotal = 0;
  const rows = [];

  for (const file of files) {
    const input = path.join(IMG_DIR, file);
    const output = path.join(IMG_DIR, file.replace(RASTER, '.webp'));
    const maxEdge = MAX_EDGE[file] || DEFAULT_MAX_EDGE;

    const beforeBytes = fs.statSync(input).size;
    await sharp(input)
      .resize(maxEdge, maxEdge, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(output);
    const afterBytes = fs.statSync(output).size;

    beforeTotal += beforeBytes;
    afterTotal += afterBytes;
    rows.push({
      file,
      before: (beforeBytes / 1024).toFixed(0) + ' KB',
      after: (afterBytes / 1024).toFixed(0) + ' KB',
      saved: (100 - (afterBytes / beforeBytes) * 100).toFixed(0) + '%',
    });
  }

  console.table(rows);
  console.log(
    `Total: ${(beforeTotal / 1024 / 1024).toFixed(2)} MB -> ${(afterTotal / 1024 / 1024).toFixed(2)} MB ` +
      `(${(100 - (afterTotal / beforeTotal) * 100).toFixed(0)}% smaller)`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
