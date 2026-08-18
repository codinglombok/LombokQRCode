/**
 * LombokQRCode — Core test suite
 *
 * Covers: QR encoding, Code128 encoding, i18n catalog, SVG rendering.
 * Uses Node.js built-in test runner (node --test).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { encodeQR } from '../core/qr/encoder';
import { detectMode, BitBuffer } from '../core/qr/segments';
import { computeECCodewords } from '../core/qr/reed-solomon';
import { encodeCode128 } from '../core/barcode/code128';
import { getMessages, availableLocales } from '../i18n';
import { renderQRToSVG, matrixToSVG, listTemplates } from '../render/svg';
import { renderCode128ToSVG } from '../render/barcode-svg';

// ─── QR encoder ──────────────────────────────────────

describe('encodeQR', () => {
  it('encodes numeric-only text', () => {
    const result = encodeQR('01234567', { errorCorrectionLevel: 'L' });
    assert.equal(result.version, 1);
    assert.equal(result.size, 21);
    assert.equal(result.errorCorrectionLevel, 'L');
    assert.ok(Array.isArray(result.modules));
    assert.equal(result.modules.length, 21);
    assert.equal(result.modules[0].length, 21);
  });

  it('encodes alphanumeric text', () => {
    const result = encodeQR('HELLO WORLD', { errorCorrectionLevel: 'Q' });
    assert.ok(result.version >= 1);
    assert.equal(result.errorCorrectionLevel, 'Q');
  });

  it('encodes byte-mode UTF-8 text', () => {
    const result = encodeQR('https://example.com/path?q=hello', { errorCorrectionLevel: 'M' });
    assert.ok(result.version >= 1);
    assert.ok(result.size > 0);
  });

  it('encodes long text at higher versions', () => {
    const longText = 'A'.repeat(200);
    const result = encodeQR(longText, { errorCorrectionLevel: 'L' });
    assert.ok(result.version > 1);
  });

  it('throws on text exceeding max capacity', () => {
    const impossiblyLong = 'X'.repeat(5000);
    assert.throws(
      () => encodeQR(impossiblyLong, { errorCorrectionLevel: 'H' }),
      /too long/i,
    );
  });

  it('respects minVersion', () => {
    const result = encodeQR('A', { minVersion: 5, errorCorrectionLevel: 'L' });
    assert.ok(result.version >= 5);
  });

  it('produces boolean[][] grid with only boolean values', () => {
    const result = encodeQR('test');
    for (const row of result.modules) {
      for (const cell of row) {
        assert.equal(typeof cell, 'boolean');
      }
    }
  });

  it('produces square matrix (size × size)', () => {
    const result = encodeQR('test');
    assert.equal(result.modules.length, result.size);
    for (const row of result.modules) {
      assert.equal(row.length, result.size);
    }
  });

  it('encodes all 4 EC levels', () => {
    for (const level of ['L', 'M', 'Q', 'H'] as const) {
      const result = encodeQR('test', { errorCorrectionLevel: level });
      assert.equal(result.errorCorrectionLevel, level);
      assert.ok(result.size > 0);
    }
  });
});

// ─── Mode detection ──────────────────────────────────

describe('detectMode', () => {
  it('detects numeric', () => assert.equal(detectMode('1234567890'), 'numeric'));
  it('detects alphanumeric', () => assert.equal(detectMode('HELLO 123'), 'alphanumeric'));
  it('detects byte for lowercase', () => assert.equal(detectMode('hello'), 'byte'));
  it('detects byte for UTF-8', () => assert.equal(detectMode('こんにちは'), 'byte'));
  it('empty string is numeric', () => assert.equal(detectMode(''), 'numeric'));
});

// ─── BitBuffer ───────────────────────────────────────

describe('BitBuffer', () => {
  it('stores and converts bits to bytes', () => {
    const buf = new BitBuffer();
    buf.put(0b11001010, 8);
    const bytes = buf.toBytes();
    assert.equal(bytes.length, 1);
    assert.equal(bytes[0], 0xca);
  });

  it('pads incomplete last byte with zeros', () => {
    const buf = new BitBuffer();
    buf.put(0b111, 3);
    const bytes = buf.toBytes();
    assert.equal(bytes.length, 1);
    assert.equal(bytes[0], 0b11100000);
  });

  it('tracks length in bits', () => {
    const buf = new BitBuffer();
    buf.put(0, 5);
    assert.equal(buf.length, 5);
    buf.put(0, 3);
    assert.equal(buf.length, 8);
  });
});

// ─── Reed-Solomon ────────────────────────────────────

describe('computeECCodewords', () => {
  it('produces correct number of EC codewords', () => {
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    const ec = computeECCodewords(data, 10);
    assert.equal(ec.length, 10);
  });

  it('returns all-zero remainder for zero data', () => {
    const data = [0, 0, 0, 0];
    const ec = computeECCodewords(data, 7);
    assert.equal(ec.length, 7);
    assert.ok(ec.every((v) => v === 0));
  });

  it('produces deterministic output', () => {
    const data = [100, 200, 50];
    const a = computeECCodewords(data, 10);
    const b = computeECCodewords(data, 10);
    assert.deepEqual(a, b);
  });
});

// ─── Code128 ─────────────────────────────────────────

describe('encodeCode128', () => {
  it('encodes simple ASCII text', () => {
    const result = encodeCode128('Hello');
    assert.ok(result.symbols.length > 0);
    assert.ok(result.widths.length > 0);
  });

  it('uses subset C for long digit runs', () => {
    const result = encodeCode128('123456');
    // Start C (105) should be first symbol
    assert.equal(result.symbols[0], 105);
  });

  it('uses subset B for non-digit text', () => {
    const result = encodeCode128('ABC');
    // Start B (104) should be first symbol
    assert.equal(result.symbols[0], 104);
  });

  it('includes checksum and stop', () => {
    const result = encodeCode128('Test');
    const len = result.symbols.length;
    // Last symbol is STOP (106)
    assert.equal(result.symbols[len - 1], 106);
    // Second-to-last is checksum (0-102)
    assert.ok(result.symbols[len - 2] >= 0 && result.symbols[len - 2] <= 102);
  });

  it('throws on empty input', () => {
    assert.throws(() => encodeCode128(''), /empty/i);
  });

  it('throws on non-ASCII input', () => {
    assert.throws(() => encodeCode128('café'), /out of range/i);
  });

  it('handles mixed digit/alpha text', () => {
    const result = encodeCode128('SKU-00119827');
    assert.ok(result.symbols.length > 0);
    assert.ok(result.widths.length > 0);
  });

  it('widths sum matches expected module count', () => {
    const result = encodeCode128('A');
    const totalModules = result.widths.reduce((a, b) => a + b, 0);
    // Each symbol = 11 modules, stop = 13 modules
    // 'A' → START_B(11) + 'A'(11) + checksum(11) + STOP(13) = 46
    assert.equal(totalModules, 46);
  });
});

// ─── i18n ────────────────────────────────────────────

describe('i18n', () => {
  it('returns English messages by default', () => {
    const msgs = getMessages();
    assert.ok(msgs.scanPromptCamera.length > 0);
    assert.ok(msgs.labelCopy === 'Copy');
  });

  it('returns Indonesian messages', () => {
    const msgs = getMessages('id');
    assert.equal(msgs.labelCopy, 'Salin');
  });

  it('falls back to English for unknown locale', () => {
    const msgs = getMessages('xx' as any);
    assert.equal(msgs.labelCopy, 'Copy');
  });

  it('lists all 11 locales', () => {
    const locales = availableLocales();
    assert.equal(locales.length, 11);
    assert.ok(locales.includes('en'));
    assert.ok(locales.includes('id'));
    assert.ok(locales.includes('ja'));
  });

  it('every locale has all required keys', () => {
    const requiredKeys: Array<keyof ReturnType<typeof getMessages>> = [
      'errorTooLong', 'errorUnsupportedChar', 'errorEmptyInput',
      'scanPromptCamera', 'scanPromptNoCamera', 'scanPromptDenied',
      'labelCopy', 'labelDownload', 'labelScanQR', 'labelScanBarcode',
    ];
    for (const locale of availableLocales()) {
      const msgs = getMessages(locale);
      for (const key of requiredKeys) {
        assert.ok(typeof msgs[key] === 'string' && msgs[key].length > 0,
          `${locale}.${key} must be a non-empty string`);
      }
    }
  });
});

// ─── SVG rendering ───────────────────────────────────

describe('renderQRToSVG', () => {
  it('returns valid SVG string', () => {
    const svg = renderQRToSVG('test');
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(svg.includes('</svg>'));
  });

  it('applies named template', () => {
    const svg = renderQRToSVG('test', { template: 'ocean' });
    assert.ok(svg.includes('linearGradient'));
  });

  it('throws on unknown template name', () => {
    assert.throws(
      () => renderQRToSVG('test', { template: 'nonexistent' }),
      /unknown template/i,
    );
  });

  it('renders with custom template object', () => {
    const svg = renderQRToSVG('test', {
      template: { dotStyle: 'dots', cornerStyle: 'dot', foreground: '#ff0000' },
    });
    assert.ok(svg.includes('circle'));
  });

  it('includes accessibility attributes', () => {
    const svg = renderQRToSVG('test');
    assert.ok(svg.includes('role="img"'));
    assert.ok(svg.includes('aria-label'));
  });
});

describe('listTemplates', () => {
  it('returns array of template names', () => {
    const templates = listTemplates();
    assert.ok(Array.isArray(templates));
    assert.ok(templates.length >= 6);
    assert.ok(templates.includes('classic'));
    assert.ok(templates.includes('ocean'));
    assert.ok(templates.includes('midnight'));
  });
});

describe('matrixToSVG', () => {
  it('converts QRCodeResult to SVG', () => {
    const result = encodeQR('hello');
    const svg = matrixToSVG(result, 'rounded');
    assert.ok(svg.includes('<svg'));
    assert.ok(svg.includes('rx='));
  });
});

// ─── Barcode SVG rendering ───────────────────────────

describe('renderCode128ToSVG', () => {
  it('returns valid SVG', () => {
    const svg = renderCode128ToSVG('HELLO');
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('</svg>'));
  });

  it('includes human-readable text by default', () => {
    const svg = renderCode128ToSVG('TEST');
    assert.ok(svg.includes('<text'));
    assert.ok(svg.includes('TEST'));
  });

  it('hides text when showText=false', () => {
    const svg = renderCode128ToSVG('TEST', { showText: false });
    assert.ok(!svg.includes('<text'));
  });

  it('sanitizes foreground color', () => {
    const svg = renderCode128ToSVG('X', { foreground: 'javascript:alert(1)' });
    assert.ok(!svg.includes('javascript:'));
  });

  it('includes accessibility attributes', () => {
    const svg = renderCode128ToSVG('X');
    assert.ok(svg.includes('role="img"'));
    assert.ok(svg.includes('aria-label'));
  });
});
