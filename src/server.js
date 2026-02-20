const path = require('path');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3322;

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '..', 'views'));

app.use(express.static(path.join(__dirname, '..', 'public')));

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

app.get('/design', (req, res) => {
  res.render('design');
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
