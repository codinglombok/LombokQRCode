/**
 * Code 128 barcode encoder (subsets A, B, C) with automatic subset
 * selection for the shortest encoding. Clean-room implementation of
 * the public Code 128 symbology (no royalties, ISO/IEC 15417).
 */

// Code 128 symbol values 0-102 map to patterns of 6 bar/space widths (11 modules).
// This table is the standard published Code 128 pattern set.
const PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131', '211412',
  '211214', '211232', '2331112',
];

export const CODE128_START_A = 103;
export const CODE128_START_B = 104;
export const CODE128_START_C = 105;
export const CODE128_STOP = 106;
const SWITCH_TO_A = 101;
const SWITCH_TO_B = 100;
const SWITCH_TO_C = 99;
const SHIFT = 98;
const FNC1 = 102;

export interface Code128Result {
  /** Symbol values in order, including start/stop and checksum. */
  symbols: number[];
  /** Bar/space widths (in modules) for the full barcode, alternating bar/space starting with a bar. */
  widths: number[];
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

/** Counts how many consecutive digits (in pairs) start at index i, for subset-C runs. */
function digitRunLength(text: string, i: number): number {
  let len = 0;
  while (i + len < text.length && isDigit(text[i + len])) len++;
  return len;
}

/**
 * Encodes `text` (Latin-1 range, code points 0-127 for subsets A/B) as Code 128,
 * automatically switching between subset C (paired digits, most compact for
 * numeric runs) and subset B (general ASCII) as needed.
 */
export function encodeCode128(text: string): Code128Result {
  if (text.length === 0) throw new Error('LombokQRCode: Code128 input must not be empty.');
  for (const ch of text) {
    if (ch.charCodeAt(0) > 127) {
      throw new Error(`LombokQRCode: Code128 supports ASCII 0-127 only ("${ch}" is out of range).`);
    }
  }

  const symbols: number[] = [];
  let i = 0;
  let mode: 'A' | 'B' | 'C' = digitRunLength(text, 0) >= 4 ? 'C' : 'B';
  symbols.push(mode === 'C' ? CODE128_START_C : CODE128_START_B);

  while (i < text.length) {
    const runLen = digitRunLength(text, i);
    if (mode !== 'C' && runLen >= 4) {
      symbols.push(SWITCH_TO_C);
      mode = 'C';
    } else if (mode === 'C' && runLen < 2) {
      symbols.push(SWITCH_TO_B);
      mode = 'B';
    }

    if (mode === 'C') {
      if (runLen >= 2) {
        const pair = text.slice(i, i + 2);
        symbols.push(parseInt(pair, 10));
        i += 2;
      } else {
        // Odd leftover digit: fall back to B for it.
        symbols.push(SWITCH_TO_B);
        mode = 'B';
        symbols.push(charToSymbolB(text[i]));
        i++;
      }
    } else {
      symbols.push(charToSymbolB(text[i]));
      i++;
    }
  }

  // Checksum: start value + sum(position * value), mod 103
  let checksum = symbols[0];
  for (let k = 1; k < symbols.length; k++) checksum += symbols[k] * k;
  checksum %= 103;
  symbols.push(checksum);
  symbols.push(CODE128_STOP);

  const widths: number[] = [];
  for (const sym of symbols) {
    for (const w of PATTERNS[sym]) widths.push(Number(w));
  }
  return { symbols, widths };
}

function charToSymbolB(ch: string): number {
  const code = ch.charCodeAt(0);
  // Subset B maps ASCII 32-127 to symbol values 0-95.
  if (code < 32 || code > 127) {
    throw new Error(`LombokQRCode: character code ${code} not supported in Code128 subset B.`);
  }
  return code - 32;
}
