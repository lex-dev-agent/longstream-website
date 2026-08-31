#!/usr/bin/env node
// Render the label pages in labels/ to print-ready PDF and 300 DPI PNG.
//
//   node scripts/render-label.js                     every label
//   node scripts/render-label.js classic-blonde      both sides of one label
//   node scripts/render-label.js classic-blonde-back one side
//
// The PDF is the deliverable: Chrome keeps the type as real text, so it stays
// vector and the printer can pull the fonts out of it. The PNG is for looking
// at — it covers the trim area only, without bleed or crop marks.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pathToFileURL } = require('url');
const puppeteer = require('puppeteer');

const LABELS = path.join(__dirname, '..', 'labels');
const OUT = path.join(LABELS, 'out');
const DPI = 300;
const CSS_DPI = 96; // 1 CSS px = 1/96 inch, which is how mm map to pixels

// Page size lives in each file's @page rule so it is stated once, next to the
// markup it belongs to, rather than duplicated here.
function pageSize(html) {
  const m = /@page\s*\{[^}]*size:\s*([\d.]+)mm\s+([\d.]+)mm/.exec(html);
  if (!m) throw new Error('no @page size rule found');
  return { w: Number(m[1]), h: Number(m[2]) };
}

// Which typefaces the finished PDF actually uses.
//
// Worth checking on every render: when Chrome cannot embed a face it does not
// fail, it substitutes Georgia or Segoe UI and writes a PDF that looks fine
// until someone holds the printed proof. Font names live in object streams,
// so the streams have to be inflated to read them.
function pdfFonts(file) {
  const buf = fs.readFileSync(file);
  const raw = buf.toString('latin1');
  const chunks = [raw];
  const re = /stream\r?\n/g;
  let m;
  while ((m = re.exec(raw))) {
    const start = m.index + m[0].length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) continue;
    try { chunks.push(zlib.inflateSync(buf.subarray(start, end)).toString('latin1')); } catch { /* not deflate */ }
  }
  const names = new Set();
  for (const c of chunks) {
    for (const f of c.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+.,_-]+)/g)) {
      names.add(f[1].replace(/^[A-Z]{6}\+/, '')); // strip the subset tag
    }
  }
  return [...names];
}

// Fonts we deliberately take from the operating system rather than embedding
// ourselves. Ross's label is specified in Times New Roman, so it is expected
// in that PDF; Chrome still embeds a subset, so the file stays portable.
const SYSTEM_FONTS = ['TimesNewRoman'];

// The families labels/fonts.css declares — anything else in a PDF is a
// substitution, not a choice.
function declaredFamilies() {
  const css = fs.readFileSync(path.join(LABELS, 'fonts.css'), 'utf8');
  const out = new Set(SYSTEM_FONTS);
  for (const m of css.matchAll(/font-family:\s*'([^']+)'/g)) out.add(m[1].replace(/\s+/g, ''));
  return [...out];
}

async function render(browser, file) {
  const name = path.basename(file, '.html');
  const html = fs.readFileSync(file, 'utf8');
  const { w, h } = pageSize(html);

  const page = await browser.newPage();
  // A viewport matching the page keeps percentage-based artwork positioning
  // identical between the screenshot and the PDF.
  await page.setViewport({
    width: Math.ceil((w / 25.4) * CSS_DPI),
    height: Math.ceil((h / 25.4) * CSS_DPI),
    deviceScaleFactor: DPI / CSS_DPI
  });
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);

  const pdf = path.join(OUT, name + '.pdf');
  await page.pdf({
    path: pdf,
    printBackground: true,
    preferCSSPageSize: true,
    pageRanges: '1'
  });

  // PNG of the trim area only — what the label actually looks like, with the
  // bleed and crop marks cropped off.
  const box = await page.evaluate(() => {
    const r = document.querySelector('.trim').getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const png = path.join(OUT, name + '.png');
  await page.screenshot({ path: png, clip: box });

  // .content is absolutely positioned, so anything that does not fit simply
  // spills past the trim edge and gets cut — silently, and only visible if
  // you happen to look at the foot of the page. Measure it instead.
  // Labels that place every line absolutely have no .content column to
  // overflow, so there is nothing to measure on those.
  const spill = await page.evaluate(() => {
    const c = document.querySelector('.content');
    return c ? (c.scrollHeight - c.clientHeight) / (96 / 25.4) : 0;
  });

  await page.close();
  console.log(`${name}  ${w} x ${h} mm page  ->  out/${name}.pdf, out/${name}.png`);
  if (spill > 0.1) console.log(`  ! content overflows the label by ${spill.toFixed(1)} mm`);

  const wanted = declaredFamilies();
  const strays = pdfFonts(pdf).filter(f => !wanted.some(w => f.startsWith(w)));
  if (strays.length) console.log(`  ! substituted fonts in the PDF: ${strays.join(', ')}`);
}

(async () => {
  const filter = process.argv[2];
  const files = fs.readdirSync(LABELS)
    .filter(f => f.endsWith('.html'))
    .filter(f => !filter || f.startsWith(filter))
    .map(f => path.join(LABELS, f))
    // A label declares its own page size. Anything else in here is a tool —
    // compare.html, say — and is not artwork to render.
    .filter(f => /@page\s*\{[^}]*size:/.test(fs.readFileSync(f, 'utf8')));

  if (!files.length) {
    console.error(filter ? `no label matching "${filter}"` : 'no labels found');
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch();
  try {
    for (const f of files) await render(browser, f);
  } finally {
    await browser.close();
  }
})();
