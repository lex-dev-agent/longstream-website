const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

const ginRanges = [
  {
    name: 'Blondie Dry Gin',
    description:
      'A classic dry gin with a juniper base and our secret blend of local botanicals.',
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

app.get('/', (req, res) => {
  res.render('index', {
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
