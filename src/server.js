const path = require('path');
const fs = require('fs');
const os = require('os');
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

function requirePassword() {
  return (req, res, next) => {
    if (req.cookies.design_auth === PRIVATE_PASSWORD) return next();
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
      res.cookie('design_auth', PRIVATE_PASSWORD, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.redirect(route);
    }
    res.redirect(route + '?error=1');
  };
}

const bottleCatalogue = [
  {
    id: 'blonde-dry-gin',
    name: 'Blonde Dry Gin',
    description:
      'A classic dry gin with a juniper base and our secret blend of local botanicals.',
    volume: '700ml',
    abv: '42%',
    price: 79,
    available: true,
    image: '/images/bottle-gin.webp',
    tastingNotes: 'Bright citrus, kawakawa spice and a silky finish.'
  },
  {
    id: 'louie-limoncello',
    name: 'Louie Limoncello',
    description:
      'A simple limoncello made with fresh lemons and a touch of sugar for a refreshing summer drink.',
    volume: '500ml',
    abv: '30%',
    price: 45,
    available: true,
    image: '/images/bottle-limoncello.webp',
    tastingNotes: 'Fresh lemon zest and a gentle, velvety mouthfeel.'
  },
  {
    id: 'seeking-vodka',
    name: 'Seeking Vodka',
    description:
      'A smooth vodka distilled with our signature process for a clean, neutral base.',
    volume: '700ml',
    abv: '40%',
    price: 65,
    available: false,
    image: '/images/bottle-vodka.webp',
    soldOutMessage: 'The next Seeking Vodka run is resting now. Leave your email to hear when it returns.'
  }
];

const experimentalBatches = [
  {
    id: 'manuka-smoked-gin',
    name: 'Mānuka Smoked Gin',
    blurb: 'Juniper kissed with mānuka smoke and a whisper of sea salt. Dark, savoury, unforgettable.',
    volume: '500ml',
    abv: '45%',
    price: 95,
    total: 100,
    left: 56
  },
  {
    id: 'feijoa-spring',
    name: 'Feijoa Spring Gin',
    blurb: 'A fleeting tribute to the autumn feijoa glut — bright, tropical and grassy green.',
    volume: '500ml',
    abv: '41%',
    price: 89,
    total: 80,
    left: 23
  },
  {
    id: 'barrel-aged-reserve',
    name: 'Barrel-Aged Reserve',
    blurb: 'Our Blonde Dry rested in charred oak for nine months. Spiced, golden, sippable neat.',
    volume: '500ml',
    abv: '48%',
    price: 120,
    total: 40,
    left: 9
  }
];

// --- V4 content (sourced from the Website-Beta.pdf supplied by the client) ---
// V4 is a pre-launch variant: the distillery is NOT open for business yet, so
// these carry status flags instead of being directly orderable.
const v4Bottles = [
  {
    id: 'blonde-dry-gin',
    name: 'Blonde Dry Gin',
    description:
      'A classic dry gin with a juniper base and our blend including juniper, cardamom and lime botanicals.',
    serve: 'Best served with a simple tonic and a slice of lime to garnish.',
    volume: '700mL',
    abv: '38%',
    price: 79,
    status: 'available'
  },
  {
    id: 'louies-limoncello',
    name: "Louie's Limoncello",
    description:
      'A clear, sweet and smooth limoncello made with fresh lemons and sugar for a refreshing summer drink.',
    serve: 'Best served neat in a tall narrow glass.',
    volume: '700mL',
    abv: '35%',
    price: 45,
    status: 'available'
  },
  {
    id: 'seeking-vodka',
    name: 'Seeking Vodka',
    description:
      'A smooth vodka distilled with our signature process for a clean, neutral base.',
    serve: 'Great for your favourite cocktails.',
    volume: '700mL',
    abv: '40%',
    status: 'soldout'
  }
];

const v4Experimental = [
  {
    id: 'may-morn-mill-gin',
    name: 'May Morn Mill Gin',
    description:
      'Mānuka smoked gin with a whisper of sea salt. Dark, savoury, unforgettable.',
    serve: 'Best served with a simple tonic and a slice of lemon to garnish.',
    volume: '700mL',
    abv: '38%',
    price: 79,
    status: 'available'
  },
  {
    id: 'blonde-lemon-gin',
    name: 'Blonde Lemon Gin',
    description: 'Our flagship Blonde Dry Gin steeped in lemon peel.',
    serve: 'Best served with a simple tonic and a slice of lemon to garnish.',
    volume: '700mL',
    abv: '38%',
    price: 45,
    status: 'available'
  },
  {
    id: 'old-blonde-gin',
    name: 'Old Blonde Gin',
    description:
      'Our flagship Blonde Dry Gin rested in charred oak for nine months. Spiced and golden.',
    serve: 'Best served with a simple tonic.',
    volume: '700mL',
    abv: '38%',
    status: 'coming-soon'
  }
];

// reCAPTCHA keys. Defaults are Google's official test keys (always validate and
// show a "for testing only" notice). Set RECAPTCHA_SITE_KEY / RECAPTCHA_SECRET_KEY
// in the environment with the real keys before going live.
const RECAPTCHA_SITE_KEY =
  process.env.RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

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
    name: 'Blonde Gin',
    description: 'The gin that started it all. Our classic dry gin including Juniper, Cardamom and Lime botanicals.',
    serve: 'Best served with a simple tonic and a slice of lime to garnish.',
    volume: '700mL',
    abv: '38%',
    price: 79,
    status: 'available',
    position: 'left',
    photo: true,
    photoAlt: 'Blonde Gin',
    story: [
      'This was my first success story in gin.',
      'It took over two years to refine the process, the recipe and even the prime level of alcohol (an ABV — Alcohol by Volume — of 38%).',
      'It was born of a discussion in 2020 at Flatpoint Beach on the east coast of the Wairarapa, whilst tasting various gins from around New Zealand and the world. I foolishly said I could make a gin of similar quality … and so the dare was made.',
      'Many books were read and many mistakes were made on my trusty 25-litre hobby still, until by accident I made a very smooth gin. It took another six months of trial and error to repeat it.',
      'I have been making Blonde Gin — named after my wife — ever since, and giving it to friends and family.'
    ],
    bestServed: [
      'In a tall glass with a double shot on ice',
      'With a simple tonic that does not overpower the taste',
      'Garnished with slices of lime to complement the lime in the recipe'
    ]
  },
  {
    id: 'louies-limoncello',
    name: "Louie's Limoncello",
    description: 'A clear, sweet and smooth limoncello made with fresh lemons and sugar for a refreshing summer drink.',
    serve: 'Best served neat in a tall narrow glass.',
    volume: '700mL',
    abv: '30%',
    price: 45,
    status: 'available',
    position: 'middle',
    photo: true,
    photoAlt: "Lemon peel steeping for Louie's Limoncello",
    story: [
      'A very pure vodka is produced in the first three steps of our four-step method for dry gin.',
      'The very outside layer of yellow lemon peel (the zest) is steeped in the vodka for a minimum of two weeks. The solution is then sieved and added to a sugar solution — with the correct proportions and temperature — to produce a yellow but clear, "see-through" limoncello, pleasing to both the eye and the palate.',
      'The result is a sweet and smooth limoncello, perfect for sipping to refresh you on a hot summer day or to warm you in the heart of winter.'
    ],
    bestServed: ['Neat for sipping', 'In a tall narrow shot glass']
  },
  {
    id: 'seeking-vodka',
    name: 'Seeking Vodka',
    description: 'A smooth vodka distilled with the first two steps of our signature process for a clean, neutral base.',
    serve: 'Great for your favourite cocktails.',
    volume: '700mL',
    abv: '38%',
    status: 'soldout',
    position: 'right',
    photo: true,
    photoAlt: 'Seeking Vodka',
    story: ['More to follow.'],
    bestServed: ['Neat over ice', 'In your favourite cocktail']
  }
];

const v5Experimental = [
  {
    id: 'maymorn-estate-gin',
    name: 'Maymorn Estate Gin',
    description: 'Mānuka smoked gin with a whisper of sea salt. Dark, savoury, unforgettable.',
    serve: 'Best served with a simple tonic and a slice of lemon to garnish.',
    volume: '700mL',
    abv: '38%',
    status: 'coming-soon',
    position: 'left',
    photo: true,
    photoAlt: 'The historic Maymorn Estate sawmill',
    story: [
      'Maymorn Estate Gin is a homage to the rich history of Maymorn in the Mangaroa Valley near Upper Hutt, where our distillery is located.',
      'The Maymorn Estate Sawmill was constructed in the early 1910s by May Morn Estates (NZ) Ltd. At its peak it was claimed to be the largest sawmill in New Zealand, boasting a processing capacity of 40,000 feet of timber per day. It supplied timber and cleared land for pastoral farming.'
    ],
    bestServed: [
      'In a tall glass with a double shot on ice',
      'With a simple tonic that does not overpower the taste',
      'Garnished with a slice of lemon'
    ]
  },
  {
    id: 'blonde-lemon-gin',
    name: 'Blonde Lemon Gin',
    description: 'Our flagship Blonde Gin steeped with lemon peel zest.',
    serve: 'Best served with a simple tonic and a slice of lemon to garnish.',
    volume: '700mL',
    abv: '38%',
    price: 45,
    status: 'available',
    position: 'middle',
    photo: true,
    photoAlt: 'Lemon peel steeping for Blonde Lemon Gin',
    story: [
      'This uses the same recipe as our flagship Blonde Gin, but with a different mix of cuts (heads, hearts and tails).',
      'The gin is produced using our four-step method for dry gin. The very outside layer of lemon peel is then steeped in the gin for a minimum of two weeks.',
      'The result is a clear gin, lightly coloured yellow in the bottle. It has the classic base of Blonde Gin with an extra hint of lemon.'
    ],
    bestServed: [
      'In a tall glass with a double shot on ice',
      'With a simple tonic',
      'Garnished with slices of lemon to complement the lemon in the recipe'
    ]
  },
  {
    id: 'blonde-ambition-gin',
    name: 'Blonde Ambition Gin',
    description: 'Our flagship Blonde Gin rested in charred oak for nine months. Spiced and golden.',
    serve: 'Best served with a simple tonic.',
    volume: '700mL',
    abv: '38%',
    status: 'coming-soon',
    position: 'right',
    photo: true,
    photoAlt: 'Blonde Ambition Gin',
    story: ['More info to follow.'],
    bestServed: ['With a simple tonic', 'Sipped neat over ice']
  }
];

// --- Club signup storage (SQLite) ---
// Stored outside the (root-owned) app dir so the app user can write to it.
// Override the location with CLUB_DB_PATH if needed.
// Initialised defensively: if better-sqlite3 (a native module) is missing or
// fails to load, the site must still run — signups fall back to the log.
let insertSignup = null;
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

// Main homepage now serves the V5 design (no version switcher on the public root)
app.get('/', (req, res) => {
  res.render('v5', {
    bottles: v5Bottles,
    experimentalBatches: v5Experimental,
    current: 'v5',
    hideSwitch: true,
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    clubStatus: req.query.club || null
  });
});

app.get('/design', requirePassword(), (req, res) => {
  res.render('design');
});
app.post('/design', handlePasswordPost('/design'));

// Homepage design variations (for review / "lock in the style")
app.get('/variations', (req, res) => res.render('variations'));
// V0 = the original/live homepage, shown with the compare switcher
app.get('/v0', (req, res) => {
  res.render('index', { bottles: bottleCatalogue, showSwitch: true, current: 'v0' });
});
['v1', 'v2', 'v3'].forEach((variant) => {
  app.get('/' + variant, (req, res) => {
    res.render(variant, {
      bottles: bottleCatalogue,
      experimentalBatches,
      current: variant
    });
  });
});

// V4 = pre-launch variant with its own PDF-sourced content and reCAPTCHA club form
app.get('/v4', (req, res) => {
  res.render('v4', {
    bottles: v4Bottles,
    experimentalBatches: v4Experimental,
    current: 'v4',
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    clubStatus: req.query.club || null
  });
});
app.post('/v4/club', async (req, res) => {
  // Honeypot: bots fill this hidden field; humans never see it.
  if (req.body.company) return res.redirect('/v4?club=ok#club');
  const email = (req.body.email || '').trim();
  const validEmail = /^\S+@\S+\.\S+$/.test(email);
  const human = await verifyRecaptcha(req.body['g-recaptcha-response'], req.ip);
  if (validEmail && human) {
    saveSignup(email, 'v4', req);
    return res.redirect('/v4?club=ok#club');
  }
  return res.redirect('/v4?club=err#club');
});

// V5 = pre-launch variant with per-spirit detail pages
app.get('/v5', (req, res) => {
  res.render('v5', {
    bottles: v5Bottles,
    experimentalBatches: v5Experimental,
    current: 'v5',
    recaptchaSiteKey: RECAPTCHA_SITE_KEY,
    clubStatus: req.query.club || null
  });
});
app.post('/v5/club', async (req, res) => {
  if (req.body.company) return res.redirect('/v5?club=ok#club');
  const email = (req.body.email || '').trim();
  const validEmail = /^\S+@\S+\.\S+$/.test(email);
  const human = await verifyRecaptcha(req.body['g-recaptcha-response'], req.ip);
  if (validEmail && human) {
    saveSignup(email, 'v5', req);
    return res.redirect('/v5?club=ok#club');
  }
  return res.redirect('/v5?club=err#club');
});

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
app.post('/brief/:slug', (req, res) => {
  if (req.body.password === PRIVATE_PASSWORD) {
    res.cookie('design_auth', PRIVATE_PASSWORD, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.redirect('/brief/' + req.params.slug);
  }
  res.redirect('/brief/' + req.params.slug + '?error=1');
});

app.get('/order', (req, res) => {
  res.render('order', {
    bottles: bottleCatalogue,
    shippingOptions,
    paymentSecurity
  });
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Longstream Distillery site running on http://localhost:${PORT}`);
});

module.exports = app;
