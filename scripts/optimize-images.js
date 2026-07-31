/*
 * Generate web-optimized .webp versions of the images in public/images,
 * including subdirectories. Originals are left untouched (kept as source and
 * as the <img> onerror fallback).
 *
 *   npm run images                 # everything
 *   npm run images -- new-bottles  # just one subdirectory
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
  // Per-product bottle shots. Largest render anywhere is .v5-card-bottle at
  // 220px on the range cards, so 660px is a full 3x for high-DPI screens.
  'new-bottles': 660,
};

// Longest-edge cap for a file, by exact relative path, then by its directory,
// then by bare filename, then the default.
function maxEdgeFor(rel) {
  const dir = path.dirname(rel);
  return (
    MAX_EDGE[rel.split(path.sep).join('/')] ??
    MAX_EDGE[dir.split(path.sep).join('/')] ??
    MAX_EDGE[path.basename(rel)] ??
    DEFAULT_MAX_EDGE
  );
}

// All raster files under dir, as paths relative to IMG_DIR.
function walk(dir, rel = '') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = path.join(rel, entry.name);
    if (entry.isDirectory()) out.push(...walk(dir, r));
    else if (RASTER.test(entry.name) && !SKIP.has(entry.name)) out.push(r);
  }
  return out;
}

const RASTER = /\.(png|jpe?g)$/i;

// Tiny flat PNGs (logos) compress smaller as PNG than WebP — keep them as-is.
const SKIP = new Set(['logo.png', 'logo-white.png']);

async function run() {
  // Optional argument limits the run to one subdirectory.
  const only = process.argv[2] || '';
  const files = walk(IMG_DIR, only);
  let beforeTotal = 0;
  let afterTotal = 0;
  const rows = [];

  for (const file of files) {
    const input = path.join(IMG_DIR, file);
    const output = path.join(IMG_DIR, file.replace(RASTER, '.webp'));
    const maxEdge = maxEdgeFor(file);

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
