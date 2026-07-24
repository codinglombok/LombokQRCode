/**
 * Example Node.js/Express server using LombokQRCode to generate QR codes
 * and Code128 barcodes on-the-fly.
 *
 * Usage:
 *   npm install express lombokqrcode
 *   node example.js
 *   # Visit http://localhost:3000/qr?text=Hello&template=ocean
 *   # or http://localhost:3000/barcode?text=SKU-12345
 */

const express = require('express');
const { renderQRToSVG, renderCode128ToSVG, listTemplates } = require('lombokqrcode');

const app = express();
const port = process.env.PORT || 3000;

/**
 * GET /qr?text=<text>&template=<template>&level=<L|M|Q|H>
 *
 * Generates a QR code SVG.
 */
app.get('/qr', (req, res) => {
  const { text, template = 'classic', level = 'M' } = req.query;

  if (!text) {
    return res.status(400).json({
      error: 'Missing required parameter: text',
      example: '/qr?text=Hello&template=ocean&level=H',
    });
  }

  try {
    const svg = renderQRToSVG(text, {
      template,
      errorCorrectionLevel: level,
    });
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /barcode?text=<text>
 *
 * Generates a Code128 barcode SVG.
 */
app.get('/barcode', (req, res) => {
  const { text, showText = 'true' } = req.query;

  if (!text) {
    return res.status(400).json({
      error: 'Missing required parameter: text',
      example: '/barcode?text=SKU-12345&showText=true',
    });
  }

  try {
    const svg = renderCode128ToSVG(text, {
      showText: showText === 'true',
    });
    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/templates
 *
 * Lists available templates.
 */
app.get('/api/templates', (req, res) => {
  res.json({ templates: listTemplates() });
});

/**
 * GET /
 *
 * Simple HTML test page.
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>LombokQRCode Server</title>
      <style>
        body { font-family: system-ui; max-width: 600px; margin: 2rem auto; }
        .example { background: #f5f5f5; padding: 1rem; margin: 1rem 0; border-radius: 4px; overflow-x: auto; }
        code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 2px; }
      </style>
    </head>
    <body>
      <h1>LombokQRCode Server</h1>
      <p>This server generates QR codes and barcodes on-the-fly.</p>

      <h2>QR Code endpoint</h2>
      <p><code>GET /qr?text=&lt;text&gt;&template=&lt;template&gt;&level=&lt;L|M|Q|H&gt;</code></p>
      <div class="example">
        <a href="/qr?text=https://github.com/codinglombok/LombokQRCode&template=ocean&level=H">/qr?text=https://github.com/codinglombok/LombokQRCode&template=ocean&level=H</a>
      </div>

      <h2>Barcode endpoint</h2>
      <p><code>GET /barcode?text=&lt;text&gt;</code></p>
      <div class="example">
        <a href="/barcode?text=SKU-2026-001&showText=true">/barcode?text=SKU-2026-001&showText=true</a>
      </div>

      <h2>Available templates</h2>
      <div class="example">
        <a href="/api/templates">/api/templates</a>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`LombokQRCode server running on http://localhost:${port}`);
  console.log(`  QR:      http://localhost:${port}/qr?text=Hello&template=ocean`);
  console.log(`  Barcode: http://localhost:${port}/barcode?text=TEST`);
});
