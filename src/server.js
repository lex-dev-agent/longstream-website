const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

const ginRanges = [
  {
    name: 'Kauri Coast Dry',
    description:
      'A classic dry gin with a New Zealand twist – balancing citrus, kawakawa leaves, and hand cracked juniper.',
    botanicals: ['Juniper', 'Kawakawa', 'Mānuka Honey', 'Lemon Peel']
  },
  {
    name: 'Southern Lights Floral',
    description:
      'Delicately perfumed with wild gorse flowers and lavender from Central Otago for an aromatic, silky finish.',
    botanicals: ['Juniper', 'Wild Gorse', 'Lavender', 'Rata Blossom']
  },
  {
    name: 'Fiordland Smokehouse',
    description:
      'A bold, savoury gin rested over mānuka wood smoke to add warmth to cocktails and slow evenings.',
    botanicals: ['Juniper', 'Horopito', 'Mānuka Smoke', 'Pink Peppercorn']
  }
];

const experiences = [
  {
    title: 'Monthly Distilling Workshops',
    description:
      'Learn to balance botanicals with our head distiller and craft a personalised 200ml bottle to take home.'
  },
  {
    title: 'Botanical Foraging Walks',
    description:
      'Join a guided trek through native bush to discover the wild ingredients that inspire each release.'
  },
  {
    title: 'Private Tasting Evenings',
    description:
      'Host an intimate gin tasting for friends or colleagues featuring bespoke cocktails and food pairings.'
  }
];

const awards = [
  {
    year: 2022,
    name: 'NZ Artisan Spirits Awards – Gold for Kauri Coast Dry'
  },
  {
    year: 2023,
    name: 'Australasian Craft Distillers Showcase – People\'s Choice'
  },
  {
    year: 2024,
    name: 'International Garden Gins – Best Use of Native Botanicals'
  }
];

app.get('/', (req, res) => {
  res.render('index', {
    ginRanges,
    experiences,
    awards
  });
});

app.use((req, res) => {
  res.status(404).render('404');
});

app.listen(PORT, () => {
  console.log(`Longstream Botanicals site running on http://localhost:${PORT}`);
});

module.exports = app;
