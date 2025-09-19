# Longstream Botanicals

A simple marketing website for an imagined New Zealand homebrew gin company, built with [Express](https://expressjs.com/) and [Pug](https://pugjs.org/).

## Requirements

- Node.js 18+

## Getting started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm start
```

The site will be available at [http://localhost:3000](http://localhost:3000).

## Project structure

```
├── public/           # Static assets such as CSS
├── src/              # Express application entry point
├── views/            # Pug templates
├── package.json
└── README.md
```

## Customising content

Most of the on-page content is defined in `src/server.js` as simple JavaScript objects. Update those values to tailor the product range, events, or awards to your needs.
