const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const express = require('express');
// marked is ESM-only; load it lazily via dynamic import (only used for /brief pages)
let markedPromise = null;
function getMarked() {
  if (!markedPromise) markedPromise = import('marked').then((m) => m.marked);
  return markedPromise;
}
// Native module — load defensively so a missing/broken binary can't crash the app
let Database = null;
try {
  Database = require('better-sqlite3');
} catch (err) {
  console.error('better-sqlite3 unavailable:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3322;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

const PRIVATE_PASSWORD = 'spaties23';

// --- Gated-page sessions ---------------------------------------------------
// The cookie holds a signed "expires at" stamp instead of the password itself,
// so the server can reject a stale session. A browser-side maxAge alone isn't
// an expiry: the old cookie value was the password, so replaying it worked
// forever. Expiry is absolute — it is not extended by activity, so a session
// always ends SESSION_TTL_MS after sign-in.
// Override with AUTH_TTL_MS (session length) / AUTH_SECRET (signing key).
const SESSION_TTL_MS = Number(process.env.AUTH_TTL_MS) || 7 * 24 * 60 * 60 * 1000;
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  crypto.createHash('sha256').update('longstream-session:' + PRIVATE_PASSWORD).digest('hex');

function signExpiry(expiresAt) {
  return crypto.createHmac('sha256', AUTH_SECRET).update(String(expiresAt)).digest('hex');
}

function issueSession(req, res) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  res.cookie('design_auth', expiresAt + '.' + signExpiry(expiresAt), {
    httpOnly: true,
    sameSite: 'lax',
    // Behind nginx the app itself sees http, so trust the forwarded proto.
    secure: req.secure || req.get('x-forwarded-proto') === 'https',
    maxAge: SESSION_TTL_MS
  });
}

function validSession(req) {
  const [expiresAt, sig] = String(req.cookies.design_auth || '').split('.');
  if (!/^\d+$/.test(expiresAt || '') || Date.now() > Number(expiresAt)) return false;
  const expected = Buffer.from(signExpiry(expiresAt), 'hex');
  const given = Buffer.from(sig || '', 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function requirePassword() {
  return (req, res, next) => {
    if (validSession(req)) return next();
    const postTo = req.path;
    const error = req.query.error ? 'Incorrect password' : null;
    res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Password Required</title>
<style>body{font-family:system-ui;background:#111;color:#eee;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
form{text-align:center}input{padding:10px 14px;border-radius:6px;border:1px solid #444;background:#222;color:#eee;font-size:16px;margin-bottom:10px;display:block;width:240px}
button{padding:10px 24px;border-radius:6px;border:none;background:#5e6ad2;color:#fff;font-size:16px;cursor:pointer}
.err{color:#e55;font-size:14px;margin-bottom:10px}</style></head>
<body><form method="POST" action="${postTo}">${error ? '<p class="err">' + error + '</p>' : ''}
<input type="password" name="password" placeholder="Password" autofocus>
<button type="submit">Enter</button></form></body></html>`);
  };
}

function handlePasswordPost(route) {
  return (req, res) => {
    if (req.body.password === PRIVATE_PASSWORD) {
      issueSession(req, res);
      return res.redirect(route);
    }
    res.redirect(route + '?error=1');
  };
}


// reCAPTCHA keys. Defaults are Google's official test keys (always validate and
// show a "for testing only" notice). Set RECAPTCHA_SITE_KEY / RECAPTCHA_SECRET_KEY
// in the environment with the real keys before going live.
const RECAPTCHA_SITE_KEY =
  process.env.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

// Defaults for the shared club-signup footer partial, so every page can render it.
// Per-route render() locals (e.g. the homepage's clubStatus from ?club=) override these.
app.locals.recaptchaSiteKey = RECAPTCHA_SITE_KEY;
app.locals.clubStatus = null;

async function verifyRecaptcha(token, ip) {
  if (!token) return false;
  try {
    const params = new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: token });
    if (ip) params.append('remoteip', ip);
    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await resp.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('reCAPTCHA verification failed:', err.message);
    return false;
  }
}

// --- V5 content (sourced from "Website Beta v2.pdf") ---
// V5 = pre-launch variant with per-spirit detail pages. Each spirit keeps the
// column position it occupies on The Range (left / middle / right) on its detail page.
const v5Bottles = [
  {
    id: 'blonde-gin',
    name: 'Classic Blonde Gin',
    bottle: '/images/new-bottles/classic-blonde.png',
    description: 'A classic dry gin with Juniper, Cardamom and Lime botanicals.',
    serve: 'Best served with a simple tonic and a slice of lime.',
    volume: '700mL',
    abv: '38%',
    price: 79,
    status: 'available',
    position: 'left',
    photo: true,
    photoAlt: 'Classic Blonde Gin',
    story: [
      'This was my first success story in gin.',
      'It took over two years to refine the process, the recipe and even the prime level of alcohol (an ABV — Alcohol by Volume — of 38%).',
      'It was born of a discussion in 2018 at Flatpoint Beach on the east coast of the Wairarapa, whilst tasting various gins from around New Zealand and the world. I foolishly said I could make a gin of similar quality … and so the dare was made.',
      'Many books were read and many mistakes were made on my trusty 25-litre hobby still, until by accident I made a very smooth gin. It took another six months of trial and error to repeat it.',
      'I have been making Classic Blonde Gin — named after my wife — ever since, and giving it to friends and family.'
    ],
    bestServed: [
      'In a tall glass with a double shot on ice',
      'With a simple tonic that does not overpower the taste',
      'Garnished with slices of lime to complement the lime in the recipe'
    ]
  },
  {
    id: 'zesty-blonde-gin',
    name: 'Zesty Blonde Gin',
    bottle: '/images/new-bottles/zesty-blonde.png',
    description: 'Our signature Classic Blonde Gin steeped with lemon peel zest.',
    serve: 'Best served with a simple tonic.',
    volume: '700mL',
    abv: '38%',
    price: 89,
    status: 'available',
    position: 'middle',
    photo: true,
    photoAlt: 'Lemon peel steeping for Zesty Blonde Gin',
    story: [
      'Zesty Blonde Gin uses the same recipe as our flagship Classic Blonde Gin, but with a different mix of cuts (heads, hearts and tails).',
      'The gin is produced using our four-step method for Longstream Classic Blonde dry gin. The very outside layer of lemon peel is then steeped in the gin for a minimum of two weeks.',
      'The result is a clear gin, lightly coloured yellow in the bottle. It has the classic base of Blonde Gin with an extra hint of lemon.',
      'Depending on the mixer it usually appears clear in its final presentation.'
    ],
    bestServed: [
      'As a double shot in a tall glass with a simple tonic and a slice of lemon to complement the botanicals'
    ]
  },
  {
    id: 'louies-limoncello',
    name: "Louie's Limoncello",
    bottle: '/images/new-bottles/louies-limoncello.png',
    description: 'A clear, sweet and smooth limoncello made with fresh lemons and sugar.',
    serve: 'Best sipped neat and served in a tall narrow shot glass.',
    volume: '700mL',
    abv: '25%',
    price: 49,
    status: 'available',
    position: 'right',
    photo: true,
    photoAlt: "Lemon peel steeping for Louie's Limoncello",
    story: [
      'A very pure vodka is produced in the first three steps of our four-step method for dry gin.',
      'The very outside layer of yellow lemon peel (the zest) is steeped in the vodka for a minimum of two weeks. The solution is then sieved and added to a sugar solution — with the correct proportions and temperature — to produce a yellow but clear limoncello, pleasing to both the eye and the palate.',
      'The result is a sweet and smooth limoncello, perfect for sipping to refresh you on a hot summer day or to warm you in the heart of winter.'
    ],
    bestServed: [
      'Straight from the bottle (Neat) in a tall narrow shot glass for sipping'
    ]
  }
];

const v5Experimental = [
  {
    id: 'coastal-blonde-gin',
    name: 'Coastal Blonde Gin',
    bottle: '/images/new-bottles/coastal-blonde.png',
    description: 'Our Classic Blonde Gin with a whisper of sea salt. Crisp and warm spice with a saline finish.',
    serve: 'Best served with a simple tonic.',
    volume: '700mL',
    abv: '38%',
    status: 'coming-soon',
    position: 'left',
    photo: true,
    photoAlt: 'Coastal Blonde Gin',
    story: [
      'This uses the same recipe as our flagship Classic Blonde Gin, but with a different mix of cuts (heads, hearts and tails).',
      'Manuka and Seaweed is then steeped in the gin for a minimum of two weeks.',
      'The result is a clear gin, lightly amber coloured in the bottle. It has the classic base of Blonde Gin with an extra hint of sea and forest.',
      'Depending on the mixer it usually appears clear in its final presentation.'
    ],
    bestServed: [
      'As a double shot in a tall glass with a simple tonic and a slice of lemon to complement the salt & botanical'
    ]
  },
  {
    id: 'blushing-blonde-gin',
    name: 'Blushing Blonde Gin',
    bottle: '/images/new-bottles/blushing-blonde.png',
    description: 'Our Classic Blonde Gin with a berry finish. Crisp and warm spice, softly coloured.',
    serve: 'Best served with a simple tonic.',
    volume: '700mL',
    abv: '38%',
    status: 'coming-soon',
    position: 'middle',
    photo: true,
    photoAlt: 'Blushing Blonde Gin',
    story: ['More to follow.'],
    bestServed: ['With a simple tonic', 'Garnished with fresh berries']
  },
  {
    id: 'maymorn-estate-gin',
    name: 'Maymorn Estate Gin',
    bottle: '/images/new-bottles/maymorn-estate.png',
    description: 'Our signature Classic Blonde Gin rested in charred oak barrels. Spiced and golden.',
    serve: 'Best served with a simple tonic and a slice of lemon.',
    volume: '700mL',
    abv: '38%',
    status: 'coming-soon',
    position: 'right',
    photo: true,
    photoAlt: 'The historic Maymorn Estate sawmill',
    story: [
      'Maymorn Estate Gin is a homage to the rich history of Maymorn in the Mangaroa Valley near Upper Hutt, where our distillery is located.',
      'The May Morn Estate Sawmill was constructed in the early 1910s by May Morn Estates (NZ) Ltd at what is now the end of MacLaren Street Maymorn, Upper Hutt. At its peak it was claimed to be the largest sawmill in New Zealand, boasting a processing capacity of 40,000 feet of timber per day. Maymorn supplied timber and cleared land for pastoral farming.'
    ],
    bestServed: [
      'As a double shot in a tall glass with a simple tonic and a slice of lemon to complement the botanicals'
    ]
  }
];

// --- Club signup storage (SQLite) ---
// Stored outside the (root-owned) app dir so the app user can write to it.
// Override the location with CLUB_DB_PATH if needed.
// Initialised defensively: if better-sqlite3 (a native module) is missing or
// fails to load, the site must still run — signups fall back to the log.
let insertSignup = null;
let selectSignups = null;
try {
  if (!Database) throw new Error('better-sqlite3 module not loaded');
  const CLUB_DB_PATH =
    process.env.CLUB_DB_PATH || path.join(os.homedir(), '.longstream', 'club-signups.db');
  fs.mkdirSync(path.dirname(CLUB_DB_PATH), { recursive: true });
  const clubDb = new Database(CLUB_DB_PATH);
  clubDb.pragma('journal_mode = WAL');
  clubDb.exec(`CREATE TABLE IF NOT EXISTS club_signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    variant TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );`);
  insertSignup = clubDb.prepare(
    'INSERT OR IGNORE INTO club_signups (email, variant, ip, user_agent) VALUES (?, ?, ?, ?)'
  );
  selectSignups = clubDb.prepare(
    'SELECT email, variant, created_at FROM club_signups ORDER BY id DESC'
  );
  console.log('Club signups -> SQLite at', CLUB_DB_PATH);
} catch (err) {
  console.error('Club DB unavailable — signups will be logged instead:', err.message);
}
function saveSignup(email, variant, req) {
  const addr = email.toLowerCase();
  if (insertSignup) {
    try {
      insertSignup.run(addr, variant, req.ip, req.get('user-agent') || null);
      return;
    } catch (err) {
      console.error('Failed to save club signup to DB:', err.message);
    }
  }
  // Fallback so a signup is never silently lost
  console.log('CLUB_SIGNUP_FALLBACK ' + JSON.stringify({ email: addr, variant, ip: req.ip, at: new Date().toISOString() }));
}

// Read the club signups for the gated admin page. Returns [] (never throws) if
// the DB isn't available, so the page renders with an empty state.
function listSignups() {
  if (!selectSignups) return null;
  try {
    return selectSignups.all();
  } catch (err) {
    console.error('Failed to read club signups:', err.message);
    return null;
  }
}

const shippingOptions = [
  {
    id: 'standard',
    label: 'Standard NZ delivery (3-5 business days)',
    price: 8.5,
    note: 'Complimentary tracking provided once your bottles leave the distillery.',
    default: true
  },
  {
    id: 'overnight',
    label: 'Overnight urban courier',
    price: 14.5,
    note: 'Order before 1pm for same-day dispatch to most North Island urban centres.'
  },
  {
    id: 'collect',
    label: 'Click & Collect — Mangaroa cellar door',
    price: 0,
    note: 'We will email you as soon as your bottles are ready for collection.'
  }
];

const paymentSecurity = {
  statement:
    'All online payments are processed through our encrypted Stripe checkout with 3D Secure support.',
  acceptedCards: ['Visa', 'Mastercard', 'American Express', 'Apple Pay']
};

// Main homepage
app.get('/', (req, res) => {
  res.render('v5', {
    bottles: v5Bottles,
    experimentalBatches: v5Experimental,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    clubStatus: req.query.club || null
  });
});

// Longstream Club signup (posted from the homepage).
// Fetch requests (X-Requested-With: fetch) get JSON so the page never reloads;
// a plain form post still falls back to a redirect.
app.post('/club', async (req, res) => {
  const wantsJson = req.get('X-Requested-With') === 'fetch';
  const done = (ok) =>
    wantsJson ? res.json({ ok }) : res.redirect(ok ? '/?club=ok#club' : '/?club=err#club');
  // Honeypot: bots fill this hidden field; humans never see it.
  if (req.body.company) return done(true);
  const email = (req.body.email || '').trim();
  const validEmail = /^\S+@\S+\.\S+$/.test(email);
  const human = await verifyRecaptcha(req.body['g-recaptcha-response'], req.ip);
  if (validEmail && human) {
    saveSignup(email, 'main', req);
    return done(true);
  }
  return done(false);
});

// New brand-aesthetic design page (password protected)
app.get('/design', requirePassword(), (req, res) => {
  res.render('design');
});
app.post('/design', handlePasswordPost('/design'));

// Previous design page, kept for reference (password protected)
app.get('/design-old', requirePassword(), (req, res) => {
  res.render('design-old');
});
app.post('/design-old', handlePasswordPost('/design-old'));

// Format a UTC SQLite timestamp ('YYYY-MM-DD HH:MM:SS') as New Zealand local
// time. Pacific/Auckland handles NZST/NZDT (daylight saving) automatically.
function toNZTime(utcStr) {
  if (!utcStr) return '';
  const d = new Date(utcStr.replace(' ', 'T') + 'Z');
  if (isNaN(d.getTime())) return utcStr;
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }).format(d);
}

// Gated view of Longstream Club signups (password-protected, same gate as /design)
app.get('/emails', requirePassword(), (req, res) => {
  const signups = listSignups();
  res.render('emails', {
    signups: (signups || []).map((r) => ({ ...r, created_at: toNZTime(r.created_at) })),
    dbAvailable: signups !== null
  });
});
app.post('/emails', handlePasswordPost('/emails'));

// Load briefs from markdown files
const BRIEFS_DIR = path.join(__dirname, '..', 'data', 'briefs');
const BRIEF_ORDER = [
  'brief.md',
  'product investigation.md',
  'regulatory research.md',
  'go-to-market strategy.md',
  'cost & margin analysis.md',
  'conclusion.md',
];

async function loadBriefs() {
  const marked = await getMarked();
  return BRIEF_ORDER.map((filename) => {
    const filePath = path.join(BRIEFS_DIR, 'longstream-' + filename);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const firstLine = raw.split('\n').find((l) => l.startsWith('# '));
    const rawTitle = firstLine
      ? firstLine.replace(/^#\s+/, '').replace(/\s*—\s*Longstream Distillery$/, '').replace(/^Longstream Distillery\s*—\s*/, '').trim()
      : filename.replace('.md', '');
    const title = rawTitle || 'Overview';
    const slug = filename.replace('.md', '').replace(/[&]/g, 'and').replace(/\s+/g, '-').toLowerCase();
    return { slug, title, html: marked(raw) };
  });
}

let briefsCache = null;
async function getBriefs() {
  if (!briefsCache) briefsCache = await loadBriefs();
  return briefsCache;
}

app.get('/brief', (req, res) => res.redirect('/brief/brief'));
app.get('/brief/:slug', requirePassword(), async (req, res) => {
  const briefs = await getBriefs();
  const docs = briefs.map((b) => ({ slug: b.slug, title: b.title }));
  const active = briefs.find((b) => b.slug === req.params.slug) || briefs[0];
  res.render('briefs', { docs, activeSlug: active.slug, activeContent: active.html });
});
app.post('/brief', handlePasswordPost('/brief'));
app.post('/brief/:slug', (req, res) =>
  handlePasswordPost('/brief/' + req.params.slug)(req, res)
);

app.get('/order', (req, res) => {
  // Show both ranges; the template greys out coming-soon / sold-out spirits and
  // only gives the available ones a quantity stepper.
  res.render('order', {
    bottles: v5Bottles,
    experimentalBatches: v5Experimental
  });
});

// Placeholder pages (linked from the standard navbar) — content to come.
const comingSoon = (pageTitle) => (req, res) => res.render('coming-soon', { pageTitle });
app.get('/our-story', comingSoon('Our Story'));
app.get('/contact', comingSoon('Contact'));

// Products — TEMPORARILY a "coming soon" placeholder. To restore the real page,
// delete the line below and uncomment the handler that follows it.
// The products.pug template and products.css are untouched and ready to go.
app.get('/products', comingSoon('Products'));

// Products — the full range + experimental batches (cards open the shared modal).
// app.get('/products', (req, res) => {
//   res.render('products', {
//     bottles: v5Bottles,
//     experimentalBatches: v5Experimental
//   });
// });

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Longstream Distillery site running on http://localhost:${PORT}`);
});

module.exports = app;
