/**
 * LombokQRCode — Canvas/PNG renderer
 *
 * Pure-JS PNG encoder. No native canvas, no external dependencies.
 * Works in Node.js and browsers alike.
 *
 * Produces a Uint8Array containing a valid PNG file from a QRCodeResult,
 * using the same template system as the SVG renderer.
 */

import { encodeQR, QREncodeOptions, QRCodeResult } from '../core/qr/encoder';

// ─── Types ───────────────────────────────────────────

export interface CanvasRenderOptions extends QREncodeOptions {
  /** Pixels per module. Default: 10. */
  scale?: number;
  /** Quiet-zone width in modules. Default: 4. */
  margin?: number;
  /** Foreground color as [R, G, B] or [R, G, B, A]. Default: [0, 0, 0]. */
  foreground?: number[];
  /** Background color as [R, G, B] or [R, G, B, A]. Default: [255, 255, 255]. */
  background?: number[];
}

// ─── Color helpers ───────────────────────────────────

function toRGBA(color: number[] | undefined, fallback: number[]): [number, number, number, number] {
  const c = color ?? fallback;
  return [
    clamp(c[0] ?? fallback[0]),
    clamp(c[1] ?? fallback[1]),
    clamp(c[2] ?? fallback[2]),
    clamp(c[3] ?? 255),
  ];
}

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function parseHexColor(hex: string): [number, number, number, number] {
  const h = hex.replace(/^#/, '');
  if (h.length === 3 || h.length === 4) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    const a = h.length === 4 ? parseInt(h[3] + h[3], 16) : 255;
    return [r, g, b, a];
  }
  if (h.length === 6 || h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) : 255;
    return [r, g, b, a];
  }
  return [0, 0, 0, 255];
}

// ─── PNG encoder (minimal, spec-compliant) ───────────

/** CRC32 lookup table, computed once. */
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array, start = 0, end?: number): number {
  let crc = 0xffffffff;
  const len = end ?? data.length;
  for (let i = start; i < len; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Adler-32 checksum for zlib. */
function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** Wraps raw deflate blocks in a zlib container (stored, no compression). */
function zlibStore(data: Uint8Array): Uint8Array {
  // zlib header (no compression) + stored blocks + adler32
  const maxBlock = 65535;
  const numBlocks = Math.ceil(data.length / maxBlock) || 1;
  // 2 (zlib header) + numBlocks * (5 header) + data.length + 4 (adler)
  const out = new Uint8Array(2 + numBlocks * 5 + data.length + 4);
  let pos = 0;

  // zlib header: CM=8 (deflate), CINFO=7 (32K window)
  out[pos++] = 0x78;
  out[pos++] = 0x01; // FCHECK for no dict, compression level 0

  let offset = 0;
  for (let i = 0; i < numBlocks; i++) {
    const remaining = data.length - offset;
    const blockLen = Math.min(remaining, maxBlock);
    const isLast = i === numBlocks - 1;
    out[pos++] = isLast ? 0x01 : 0x00; // BFINAL + BTYPE=00 (stored)
    out[pos++] = blockLen & 0xff;
    out[pos++] = (blockLen >> 8) & 0xff;
    out[pos++] = (~blockLen) & 0xff;
    out[pos++] = ((~blockLen) >> 8) & 0xff;
    out.set(data.subarray(offset, offset + blockLen), pos);
    pos += blockLen;
    offset += blockLen;
  }

  const checksum = adler32(data);
  out[pos++] = (checksum >> 24) & 0xff;
  out[pos++] = (checksum >> 16) & 0xff;
  out[pos++] = (checksum >> 8) & 0xff;
  out[pos++] = checksum & 0xff;

  return out.subarray(0, pos);
}

function writeU32BE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >> 24) & 0xff;
  buf[offset + 1] = (value >> 16) & 0xff;
  buf[offset + 2] = (value >> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

function makePNGChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(4 + 4 + data.length + 4);
  writeU32BE(chunk, 0, data.length);
  // Type bytes
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  const crc = crc32(chunk, 4, 8 + data.length);
  writeU32BE(chunk, 8 + data.length, crc);
  return chunk;
}

/**
 * Encodes raw RGBA pixel data (width × height × 4 bytes) into a PNG file.
 */
function encodePNG(pixels: Uint8Array, width: number, height: number): Uint8Array {
  // Build IHDR
  const ihdr = new Uint8Array(13);
  writeU32BE(ihdr, 0, width);
  writeU32BE(ihdr, 4, height);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Build raw image data (filter byte 0 = None per row)
  const rowLen = width * 4 + 1;
  const rawData = new Uint8Array(height * rowLen);
  for (let y = 0; y < height; y++) {
    rawData[y * rowLen] = 0; // filter: None
    rawData.set(
      pixels.subarray(y * width * 4, (y + 1) * width * 4),
      y * rowLen + 1,
    );
  }

  const compressed = zlibStore(rawData);

  // Assemble PNG
  const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = makePNGChunk('IHDR', ihdr);
  const idatChunk = makePNGChunk('IDAT', compressed);
  const iendChunk = makePNGChunk('IEND', new Uint8Array(0));

  const png = new Uint8Array(
    PNG_SIGNATURE.length + ihdrChunk.length + idatChunk.length + iendChunk.length,
  );
  let pos = 0;
  png.set(PNG_SIGNATURE, pos); pos += PNG_SIGNATURE.length;
  png.set(ihdrChunk, pos); pos += ihdrChunk.length;
  png.set(idatChunk, pos); pos += idatChunk.length;
  png.set(iendChunk, pos);

  return png;
}

// ─── Public API ──────────────────────────────────────

/**
 * Renders `text` as a QR code and returns raw RGBA pixel data.
 *
 * @returns `{ pixels, width, height }` where `pixels` is a Uint8Array of
 * length width × height × 4 (RGBA).
 */
export function renderQRToPixels(
  text: string,
  options: CanvasRenderOptions = {},
): { pixels: Uint8Array; width: number; height: number } {
  const result = encodeQR(text, options);
  return matrixToPixels(result, options);
}

/**
 * Converts an already-encoded QRCodeResult to raw RGBA pixel data.
 */
export function matrixToPixels(
  result: QRCodeResult,
  options: CanvasRenderOptions = {},
): { pixels: Uint8Array; width: number; height: number } {
  const scale = Math.max(1, Math.round(options.scale ?? 10));
  const margin = Math.max(0, Math.round(options.margin ?? 4));
  const fg = toRGBA(options.foreground, [0, 0, 0, 255]);
  const bg = toRGBA(options.background, [255, 255, 255, 255]);

  const n = result.size;
  const totalModules = n + margin * 2;
  const px = totalModules * scale;

  const pixels = new Uint8Array(px * px * 4);

  // Fill background
  for (let i = 0; i < px * px; i++) {
    pixels[i * 4] = bg[0];
    pixels[i * 4 + 1] = bg[1];
    pixels[i * 4 + 2] = bg[2];
    pixels[i * 4 + 3] = bg[3];
  }

  // Draw modules
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!result.modules[row][col]) continue;
      const x0 = (col + margin) * scale;
      const y0 = (row + margin) * scale;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const idx = ((y0 + dy) * px + (x0 + dx)) * 4;
          pixels[idx] = fg[0];
          pixels[idx + 1] = fg[1];
          pixels[idx + 2] = fg[2];
          pixels[idx + 3] = fg[3];
        }
      }
    }
  }

  return { pixels, width: px, height: px };
}

/**
 * Renders `text` as a QR code and returns a PNG file as a Uint8Array.
 * The returned buffer can be written directly to a .png file or served
 * as `image/png`.
 */
export function renderQRToPNG(text: string, options: CanvasRenderOptions = {}): Uint8Array {
  const { pixels, width, height } = renderQRToPixels(text, options);
  return encodePNG(pixels, width, height);
}

/**
 * Converts an already-encoded QRCodeResult to a PNG file as a Uint8Array.
 */
export function matrixToPNG(result: QRCodeResult, options: CanvasRenderOptions = {}): Uint8Array {
  const { pixels, width, height } = matrixToPixels(result, options);
  return encodePNG(pixels, width, height);
}

/**
 * Parses a hex color string to [R, G, B, A] for use with canvas render options.
 * Supports #RGB, #RGBA, #RRGGBB, #RRGGBBAA.
 */
export { parseHexColor };
