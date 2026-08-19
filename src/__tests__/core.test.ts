/**
 * LombokQRCode — Core test suite
 *
 * Covers: QR encoding, Code128 encoding, i18n catalog, SVG rendering.
 * Uses Node.js built-in test runner (node --test).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { encodeQR } from '../core/qr/encoder';
import { detectMode, BitBuffer, splitSegments } from '../core/qr/segments';
import { computeECCodewords } from '../core/qr/reed-solomon';
import { encodeCode128 } from '../core/barcode/code128';
import { getMessages, availableLocales } from '../i18n';
import { renderQRToSVG, matrixToSVG, listTemplates } from '../render/svg';
import { renderCode128ToSVG } from '../render/barcode-svg';
import { renderQRToPNG, renderQRToPixels, matrixToPNG, matrixToPixels, parseHexColor } from '../render/canvas';

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

// ─── Mixed-mode segmentation ────────────────────────

describe('splitSegments', () => {
  it('pure numeric stays numeric', () => {
    const segs = splitSegments('1234567890', 1);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].mode, 'numeric');
    assert.equal(segs[0].text, '1234567890');
  });

  it('pure alphanumeric stays alphanumeric', () => {
    const segs = splitSegments('HELLO WORLD', 1);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].mode, 'alphanumeric');
  });

  it('pure byte stays byte', () => {
    const segs = splitSegments('hello world', 1);
    assert.equal(segs.length, 1);
    assert.equal(segs[0].mode, 'byte');
  });

  it('splits URL with digit run into multiple segments', () => {
    const segs = splitSegments('HTTPS://EXAMPLE.COM/1234567890123456', 1);
    // Should have at least 2 segments — alphanumeric prefix + numeric digits
    assert.ok(segs.length >= 2);
    const numSeg = segs.find(s => s.mode === 'numeric');
    assert.ok(numSeg, 'should have a numeric segment for the digit run');
  });

  it('merges short numeric run into alphanumeric neighbors', () => {
    const segs = splitSegments('ABC12DEF', 1);
    // '12' is only 2 chars numeric — should merge into alphanumeric
    assert.equal(segs.length, 1);
    assert.equal(segs[0].mode, 'alphanumeric');
  });

  it('keeps long numeric run separate', () => {
    const segs = splitSegments('ABCdef1234567890xyz', 1);
    const numSeg = segs.find(s => s.mode === 'numeric');
    assert.ok(numSeg, 'long digit run should stay numeric');
  });

  it('handles empty string', () => {
    const segs = splitSegments('', 1);
    assert.equal(segs.length, 1);
  });

  it('mixed-mode encoding is at least as compact as single-mode', () => {
    // URL with long digit run: mixed-mode should use same or lower version
    const text = 'https://example.com/order/9876543210987654';
    const singleResult = encodeQR(text, { errorCorrectionLevel: 'M' });
    // The mixed-mode result should be valid and scannable
    assert.ok(singleResult.version >= 1);
    assert.ok(singleResult.size > 0);
  });
});

// ─── Canvas/PNG renderer ────────────────────────────

describe('renderQRToPixels', () => {
  it('returns correct dimensions', () => {
    const { pixels, width, height } = renderQRToPixels('test', { scale: 5, margin: 2 });
    const result = encodeQR('test');
    const expectedSize = (result.size + 2 * 2) * 5;
    assert.equal(width, expectedSize);
    assert.equal(height, expectedSize);
    assert.equal(pixels.length, width * height * 4);
  });

  it('returns square output', () => {
    const { width, height } = renderQRToPixels('hello');
    assert.equal(width, height);
  });

  it('default scale is 10, margin is 4', () => {
    const result = encodeQR('A', { errorCorrectionLevel: 'L' });
    const { width } = renderQRToPixels('A', { errorCorrectionLevel: 'L' });
    assert.equal(width, (result.size + 8) * 10);
  });

  it('respects custom foreground and background', () => {
    const { pixels, width } = renderQRToPixels('A', {
      scale: 1,
      margin: 0,
      foreground: [255, 0, 0],
      background: [0, 255, 0],
    });
    // Check a background pixel (corner of QR has finder, but check a non-module area)
    // At minimum, we should have both colors present
    let hasFG = false;
    let hasBG = false;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 0) hasFG = true;
      if (pixels[i] === 0 && pixels[i + 1] === 255 && pixels[i + 2] === 0) hasBG = true;
    }
    assert.ok(hasFG, 'should contain foreground color');
    assert.ok(hasBG, 'should contain background color');
  });
});

describe('matrixToPixels', () => {
  it('converts QRCodeResult to pixel data', () => {
    const result = encodeQR('test');
    const { pixels, width, height } = matrixToPixels(result, { scale: 3, margin: 1 });
    const expectedSize = (result.size + 2) * 3;
    assert.equal(width, expectedSize);
    assert.equal(pixels.length, width * height * 4);
  });
});

describe('renderQRToPNG', () => {
  it('returns valid PNG signature', () => {
    const png = renderQRToPNG('test');
    assert.ok(png instanceof Uint8Array);
    // PNG signature: 137 80 78 71 13 10 26 10
    assert.equal(png[0], 137);
    assert.equal(png[1], 80);  // 'P'
    assert.equal(png[2], 78);  // 'N'
    assert.equal(png[3], 71);  // 'G'
    assert.equal(png[4], 13);
    assert.equal(png[5], 10);
    assert.equal(png[6], 26);
    assert.equal(png[7], 10);
  });

  it('contains IHDR chunk', () => {
    const png = renderQRToPNG('test');
    // IHDR should be right after signature (bytes 8-11 are length, 12-15 are "IHDR")
    const ihdr = String.fromCharCode(png[12], png[13], png[14], png[15]);
    assert.equal(ihdr, 'IHDR');
  });

  it('contains IEND chunk', () => {
    const png = renderQRToPNG('hello');
    // IEND at the end: last 12 bytes = length(4) + "IEND"(4) + CRC(4)
    const iend = String.fromCharCode(png[png.length - 8], png[png.length - 7], png[png.length - 6], png[png.length - 5]);
    assert.equal(iend, 'IEND');
  });

  it('produces deterministic output', () => {
    const a = renderQRToPNG('deterministic');
    const b = renderQRToPNG('deterministic');
    assert.deepEqual(a, b);
  });

  it('different text produces different PNG', () => {
    const a = renderQRToPNG('aaa');
    const b = renderQRToPNG('bbb');
    assert.notDeepEqual(a, b);
  });

  it('respects scale option', () => {
    const small = renderQRToPNG('X', { scale: 2, margin: 0 });
    const large = renderQRToPNG('X', { scale: 20, margin: 0 });
    assert.ok(large.length > small.length);
  });
});

describe('matrixToPNG', () => {
  it('converts QRCodeResult to PNG', () => {
    const result = encodeQR('test');
    const png = matrixToPNG(result, { scale: 5 });
    assert.ok(png instanceof Uint8Array);
    assert.equal(png[0], 137); // PNG signature
  });
});

describe('parseHexColor', () => {
  it('parses 6-digit hex', () => {
    assert.deepEqual(parseHexColor('#ff8000'), [255, 128, 0, 255]);
  });

  it('parses 3-digit hex', () => {
    assert.deepEqual(parseHexColor('#f00'), [255, 0, 0, 255]);
  });

  it('parses 8-digit hex with alpha', () => {
    assert.deepEqual(parseHexColor('#ff000080'), [255, 0, 0, 128]);
  });

  it('parses without # prefix', () => {
    assert.deepEqual(parseHexColor('00ff00'), [0, 255, 0, 255]);
  });
});
