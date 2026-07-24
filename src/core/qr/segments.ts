import { EC_BLOCK_INFO, TOTAL_CODEWORDS, ErrorCorrectionLevel } from './tables';

export type Mode = 'numeric' | 'alphanumeric' | 'byte';

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';

export class BitBuffer {
  private bits: number[] = [];
  get length(): number {
    return this.bits.length;
  }
  put(value: number, numBits: number): void {
    for (let i = numBits - 1; i >= 0; i--) {
      this.bits.push((value >>> i) & 1);
    }
  }
  toBytes(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) {
        byte = (byte << 1) | (this.bits[i + j] ?? 0);
      }
      out.push(byte);
    }
    return out;
  }
}

export function detectMode(text: string): Mode {
  if (/^[0-9]*$/.test(text)) return 'numeric';
  if (new RegExp(`^[${escapeRegExp(ALPHANUMERIC_CHARS)}]*$`).test(text)) return 'alphanumeric';
  return 'byte';
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function charCountBits(mode: Mode, version: number): number {
  if (version <= 9) return mode === 'numeric' ? 10 : mode === 'alphanumeric' ? 9 : 8;
  if (version <= 26) return mode === 'numeric' ? 12 : mode === 'alphanumeric' ? 11 : 16;
  return mode === 'numeric' ? 14 : mode === 'alphanumeric' ? 13 : 16;
}

const MODE_INDICATOR: Record<Mode, number> = { numeric: 0b0001, alphanumeric: 0b0010, byte: 0b0100 };

function encodeSegment(buf: BitBuffer, text: string, mode: Mode, version: number): void {
  buf.put(MODE_INDICATOR[mode], 4);
  if (mode === 'byte') {
    const bytes = Array.from(new TextEncoder().encode(text));
    buf.put(bytes.length, charCountBits(mode, version));
    for (const b of bytes) buf.put(b, 8);
  } else if (mode === 'numeric') {
    buf.put(text.length, charCountBits(mode, version));
    for (let i = 0; i < text.length; i += 3) {
      const chunk = text.slice(i, i + 3);
      buf.put(parseInt(chunk, 10), chunk.length === 3 ? 10 : chunk.length === 2 ? 7 : 4);
    }
  } else {
    buf.put(text.length, charCountBits(mode, version));
    for (let i = 0; i < text.length; i += 2) {
      if (i + 1 < text.length) {
        const v = ALPHANUMERIC_CHARS.indexOf(text[i]) * 45 + ALPHANUMERIC_CHARS.indexOf(text[i + 1]);
        buf.put(v, 11);
      } else {
        buf.put(ALPHANUMERIC_CHARS.indexOf(text[i]), 6);
      }
    }
  }
}

function dataCapacityCodewords(version: number, level: ErrorCorrectionLevel): number {
  const [ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] = EC_BLOCK_INFO[level][version];
  return g1Blocks * g1Data + g2Blocks * g2Data;
}

/**
 * Picks the smallest QR version (1-40) that fits `text` at the requested
 * error-correction level, and builds the padded data codeword array.
 */
export function buildDataCodewords(
  text: string,
  level: ErrorCorrectionLevel,
  minVersion = 1,
  maxVersion = 40
): { version: number; codewords: number[] } {
  const mode = detectMode(text);
  for (let version = minVersion; version <= maxVersion; version++) {
    const buf = new BitBuffer();
    encodeSegment(buf, text, mode, version);
    const capacityBits = dataCapacityCodewords(version, level) * 8;
    if (buf.length > capacityBits) continue;

    // Terminator + pad to byte boundary
    const termBits = Math.min(4, capacityBits - buf.length);
    buf.put(0, termBits);
    while (buf.length % 8 !== 0) buf.put(0, 1);

    const codewords = buf.toBytes();
    const capacityBytes = capacityBits / 8;
    const padBytes = [0xec, 0x11];
    let p = 0;
    while (codewords.length < capacityBytes) {
      codewords.push(padBytes[p % 2]);
      p++;
    }
    return { version, codewords };
  }
  throw new Error('LombokQRCode: input too long for any QR version at this error-correction level.');
}
