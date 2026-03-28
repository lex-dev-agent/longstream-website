const path = require('path');
const fs = require('fs');
const express = require('express');
const { marked } = require('marked');

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
    soldOutMessage: 'The next Seeking Vodka run is resting now. Leave your email to hear when it returns.'
  }
];

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

app.get('/', (req, res) => {
  res.render('index', {
    bottles: bottleCatalogue
  });
});

app.get('/design', requirePassword(), (req, res) => {
  res.render('design');
});
app.post('/design', handlePasswordPost('/design'));

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

function loadBriefs() {
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
function getBriefs() {
  if (!briefsCache) briefsCache = loadBriefs();
  return briefsCache;
}

app.get('/brief', (req, res) => res.redirect('/brief/brief'));
app.get('/brief/:slug', requirePassword(), (req, res) => {
  const briefs = getBriefs();
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
