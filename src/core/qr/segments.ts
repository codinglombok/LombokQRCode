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

// ─── Mixed-mode segmentation (optimal segment splitting) ────────────

export interface Segment {
  mode: Mode;
  text: string;
}

function isNumeric(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 0x30 && c <= 0x39;
}

function isAlphanumeric(ch: string): boolean {
  return ALPHANUMERIC_CHARS.indexOf(ch) >= 0;
}

/**
 * Estimates the bit cost of encoding `text` in a given mode at a given version.
 * Returns the data bits (mode indicator + char count + payload), NOT including
 * terminator/padding.
 */
function segmentBitCost(text: string, mode: Mode, version: number): number {
  const overhead = 4 + charCountBits(mode, version);
  if (mode === 'numeric') {
    const fullTriples = Math.floor(text.length / 3);
    const rem = text.length % 3;
    return overhead + fullTriples * 10 + (rem === 2 ? 7 : rem === 1 ? 4 : 0);
  }
  if (mode === 'alphanumeric') {
    const pairs = Math.floor(text.length / 2);
    const rem = text.length % 2;
    return overhead + pairs * 11 + rem * 6;
  }
  // byte
  const byteLen = new TextEncoder().encode(text).length;
  return overhead + byteLen * 8;
}

/**
 * Classifies each character into its best (most compact) mode.
 */
function charMode(ch: string): Mode {
  if (isNumeric(ch)) return 'numeric';
  if (isAlphanumeric(ch)) return 'alphanumeric';
  return 'byte';
}

/**
 * Splits the input string into segments of consecutive characters sharing
 * the same best mode, then merges adjacent segments when doing so is cheaper
 * (avoids mode-switch overhead for short runs). This is a greedy approach
 * that works well in practice — the switching overhead (4-bit mode indicator +
 * char-count field) means very short segments are better merged into
 * the neighboring, less-compact mode.
 *
 * Thresholds are derived from the bit math:
 *   - Numeric run < 4 chars inside alphanumeric: merge (saves ~13 header bits,
 *     costs at most 12 data bits via alphanumeric encoding)
 *   - Numeric run < 6 chars inside byte: merge
 *   - Alphanumeric run < 11 chars inside byte for versions 1-9: merge
 *     (header savings outweigh data cost at these short lengths)
 */
export function splitSegments(text: string, version: number): Segment[] {
  if (text.length === 0) return [{ mode: 'byte', text: '' }];

  // Step 1: classify each character
  const chars = Array.from(text);
  const modes: Mode[] = chars.map(charMode);

  // Step 2: merge short numeric runs into alphanumeric
  //   header cost for numeric segment: 4 + charCountBits('numeric', v)
  //   if run length * (alphanumeric_cost_per_char - numeric_cost_per_char) < header cost → merge
  //   Simplified: merge numeric runs shorter than a threshold
  const numMergeThreshold = version <= 9 ? 4 : version <= 26 ? 4 : 5;
  let i = 0;
  while (i < modes.length) {
    if (modes[i] === 'numeric') {
      let j = i;
      while (j < modes.length && modes[j] === 'numeric') j++;
      const runLen = j - i;
      // Check neighbors
      const prevIsAlpha = i > 0 && modes[i - 1] === 'alphanumeric';
      const nextIsAlpha = j < modes.length && modes[j] === 'alphanumeric';
      if (runLen < numMergeThreshold && (prevIsAlpha || nextIsAlpha)) {
        for (let k = i; k < j; k++) modes[k] = 'alphanumeric';
      }
      i = j;
    } else {
      i++;
    }
  }

  // Step 3: merge short alphanumeric runs into byte
  const alphaMergeThreshold = version <= 9 ? 8 : version <= 26 ? 11 : 13;
  i = 0;
  while (i < modes.length) {
    if (modes[i] === 'alphanumeric') {
      let j = i;
      while (j < modes.length && modes[j] !== 'byte' && (modes[j] === 'alphanumeric' || modes[j] === 'numeric')) j++;
      // Actually only count alphanumeric (numeric already merged in step 2)
      let j2 = i;
      while (j2 < modes.length && modes[j2] === 'alphanumeric') j2++;
      const runLen = j2 - i;
      const prevIsByte = i > 0 && modes[i - 1] === 'byte';
      const nextIsByte = j2 < modes.length && modes[j2] === 'byte';
      if (runLen < alphaMergeThreshold && (prevIsByte || nextIsByte)) {
        for (let k = i; k < j2; k++) modes[k] = 'byte';
      }
      i = j2;
    } else {
      i++;
    }
  }

  // Step 4: merge short numeric runs that are still standalone into byte if neighbors are byte
  i = 0;
  while (i < modes.length) {
    if (modes[i] === 'numeric') {
      let j = i;
      while (j < modes.length && modes[j] === 'numeric') j++;
      const runLen = j - i;
      const prevIsByte = i > 0 && modes[i - 1] === 'byte';
      const nextIsByte = j < modes.length && modes[j] === 'byte';
      const numByteThreshold = version <= 9 ? 5 : version <= 26 ? 6 : 8;
      if (runLen < numByteThreshold && (prevIsByte || nextIsByte)) {
        for (let k = i; k < j; k++) modes[k] = 'byte';
      }
      i = j;
    } else {
      i++;
    }
  }

  // Step 5: collect runs into Segment[]
  const segments: Segment[] = [];
  let start = 0;
  for (let k = 1; k <= modes.length; k++) {
    if (k === modes.length || modes[k] !== modes[start]) {
      segments.push({ mode: modes[start], text: chars.slice(start, k).join('') });
      start = k;
    }
  }

  return segments;
}

function dataCapacityCodewords(version: number, level: ErrorCorrectionLevel): number {
  const [ecPerBlock, g1Blocks, g1Data, g2Blocks, g2Data] = EC_BLOCK_INFO[level][version];
  return g1Blocks * g1Data + g2Blocks * g2Data;
}

/**
 * Picks the smallest QR version (1-40) that fits `text` at the requested
 * error-correction level, and builds the padded data codeword array.
 *
 * Uses mixed-mode segmentation to split the input into optimal segments,
 * reducing the QR code size for strings with mixed content (e.g. URLs
 * containing digit runs, alphanumeric strings with lowercase tails).
 */
export function buildDataCodewords(
  text: string,
  level: ErrorCorrectionLevel,
  minVersion = 1,
  maxVersion = 40
): { version: number; codewords: number[] } {
  for (let version = minVersion; version <= maxVersion; version++) {
    const segments = splitSegments(text, version);
    const buf = new BitBuffer();
    for (const seg of segments) {
      encodeSegment(buf, seg.text, seg.mode, version);
    }
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
