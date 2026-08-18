#!/usr/bin/env node

/**
 * LombokQRCode CLI — Generate QR codes and barcodes from the command line.
 *
 * Usage:
 *   npx lombokqrcode qr "https://example.com" --template ocean --output qr.svg
 *   npx lombokqrcode barcode "SKU-12345" --output barcode.svg
 */

import * as fs from 'fs';
import * as path from 'path';
import { renderQRToSVG, renderCode128ToSVG, listTemplates } from './index';

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
LombokQRCode CLI

Usage:
  lombokqrcode qr <text> [options]
  lombokqrcode barcode <text> [options]

Options for QR:
  --template <name>        Built-in template (classic, rounded, dots, ocean, sunset, midnight)
  --level <L|M|Q|H>        Error correction level (default: M)
  --output <file>          Output SVG file (default: stdout)

Options for Barcode:
  --show-text              Include human-readable text (default: true)
  --output <file>          Output SVG file (default: stdout)

Examples:
  lombokqrcode qr "https://example.com" --template ocean --output qr.svg
  lombokqrcode barcode "SKU-12345" --show-text --output barcode.svg

Templates: ${listTemplates().join(', ')}
  `);
  process.exit(0);
}

const command = args[0];
const text = args[1];

if (!text) {
  console.error('Error: missing text argument');
  process.exit(1);
}

try {
  let output = '';

  if (command === 'qr') {
    const templateIdx = args.indexOf('--template');
    const template = templateIdx >= 0 ? args[templateIdx + 1] : 'classic';
    const levelIdx = args.indexOf('--level');
    const level = levelIdx >= 0 ? args[levelIdx + 1] : 'M';

    output = renderQRToSVG(text, {
      template,
      errorCorrectionLevel: level as any,
    });
  } else if (command === 'barcode') {
    const showText = !args.includes('--no-text');
    output = renderCode128ToSVG(text, { showText });
  } else {
    console.error(`Error: unknown command "${command}". Use "qr" or "barcode".`);
    process.exit(1);
  }

  const outIdx = args.indexOf('--output');
  if (outIdx >= 0) {
    const file = args[outIdx + 1];
    fs.writeFileSync(file, output);
    console.log(`✓ Written to ${path.resolve(file)}`);
  } else {
    console.log(output);
  }
} catch (err) {
  console.error('Error:', (err as Error).message);
  process.exit(1);
}
