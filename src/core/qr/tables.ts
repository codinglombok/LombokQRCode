/**
 * LombokQRCode — QR Code constant tables
 *
 * All values below are numeric parameters defined by the public
 * ISO/IEC 18004 QR Code standard (capacities, alignment-pattern
 * positions, error-correction block layout, generator polynomial
 * degrees). These are specification data, not another project's
 * source code — this file is an independent, clean-room encoding
 * of the standard.
 */

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export const EC_LEVEL_BITS: Record<ErrorCorrectionLevel, number> = {
  M: 0b00,
  L: 0b01,
  H: 0b10,
  Q: 0b11,
};

// Total codewords per version (index 0 unused, versions 1-40)
export const TOTAL_CODEWORDS: number[] = [
  0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655,
  733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921,
  2051, 2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706,
];

// Error correction codewords per block, and block counts, per version+level.
// Format: [ecCodewordsPerBlock, group1Blocks, group1DataCodewords, group2Blocks, group2DataCodewords]
export const EC_BLOCK_INFO: Record<ErrorCorrectionLevel, number[][]> = {
  L: [
    [0, 0, 0, 0, 0], [7, 1, 19, 0, 0], [10, 1, 34, 0, 0], [15, 1, 55, 0, 0],
    [20, 1, 80, 0, 0], [26, 1, 108, 0, 0], [18, 2, 68, 0, 0], [20, 2, 78, 0, 0],
    [24, 2, 97, 0, 0], [30, 2, 116, 0, 0], [18, 2, 68, 2, 69], [20, 4, 81, 0, 0],
    [24, 2, 92, 2, 93], [26, 4, 107, 0, 0], [30, 3, 115, 1, 116], [22, 5, 87, 1, 88],
    [24, 5, 98, 1, 99], [28, 1, 107, 5, 108], [30, 5, 120, 1, 121], [28, 3, 113, 4, 114],
    [28, 3, 107, 5, 108], [28, 4, 116, 4, 117], [28, 2, 111, 7, 112], [30, 4, 121, 5, 122],
    [30, 6, 117, 4, 118], [26, 8, 106, 4, 107], [28, 10, 114, 2, 115], [30, 8, 122, 4, 123],
    [30, 3, 117, 10, 118], [30, 7, 116, 7, 117], [30, 5, 115, 10, 116], [30, 13, 115, 3, 116],
    [30, 17, 115, 0, 0], [30, 17, 115, 1, 116], [30, 13, 115, 6, 116], [30, 12, 121, 7, 122],
    [30, 6, 121, 14, 122], [30, 17, 122, 4, 123], [30, 4, 122, 18, 123], [30, 20, 117, 4, 118],
    [30, 19, 118, 6, 119],
  ],
  M: [
    [0, 0, 0, 0, 0], [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0],
    [18, 2, 32, 0, 0], [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0],
    [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44], [30, 1, 50, 4, 51],
    [22, 6, 36, 2, 37], [22, 8, 37, 1, 38], [24, 4, 40, 5, 41], [24, 5, 41, 5, 42],
    [28, 7, 45, 3, 46], [28, 10, 46, 1, 47], [26, 9, 43, 4, 44], [26, 3, 44, 11, 45],
    [26, 3, 41, 13, 42], [26, 17, 42, 0, 0], [28, 17, 46, 0, 0], [28, 4, 47, 14, 48],
    [28, 6, 45, 14, 46], [28, 8, 47, 13, 48], [28, 19, 46, 4, 47], [28, 22, 45, 3, 46],
    [28, 3, 45, 23, 46], [28, 21, 45, 7, 46], [28, 19, 47, 10, 48], [28, 2, 46, 29, 47],
    [28, 10, 46, 23, 47], [28, 14, 46, 21, 47], [28, 14, 46, 23, 47], [28, 12, 47, 26, 48],
    [28, 6, 47, 34, 48], [28, 29, 46, 14, 47], [28, 13, 46, 32, 47], [28, 40, 47, 7, 48],
    [28, 18, 47, 31, 48],
  ],
  Q: [
    [0, 0, 0, 0, 0], [13, 1, 13, 0, 0], [22, 1, 22, 0, 0], [18, 2, 17, 0, 0],
    [26, 2, 24, 0, 0], [18, 2, 15, 2, 16], [24, 4, 19, 0, 0], [18, 2, 14, 4, 15],
    [22, 4, 18, 2, 19], [20, 4, 16, 4, 17], [24, 6, 19, 2, 20], [28, 4, 22, 4, 23],
    [26, 4, 20, 6, 21], [24, 8, 20, 4, 21], [20, 11, 16, 5, 17], [30, 5, 24, 7, 25],
    [24, 15, 19, 2, 20], [28, 1, 22, 15, 23], [28, 17, 22, 1, 23], [26, 17, 21, 4, 22],
    [30, 15, 24, 5, 25], [28, 17, 22, 6, 23], [30, 7, 24, 16, 25], [30, 11, 24, 14, 25],
    [30, 11, 24, 16, 25], [30, 7, 24, 22, 25], [28, 28, 22, 6, 23], [30, 8, 23, 26, 24],
    [30, 4, 24, 31, 25], [30, 1, 23, 37, 24], [30, 15, 24, 25, 25], [30, 42, 24, 1, 25],
    [30, 10, 24, 35, 25], [30, 29, 24, 19, 25], [30, 44, 24, 7, 25], [30, 39, 24, 14, 25],
    [30, 46, 24, 10, 25], [30, 49, 24, 10, 25], [30, 48, 24, 14, 25], [30, 43, 24, 22, 25],
    [30, 34, 24, 34, 25],
  ],
  H: [
    [0, 0, 0, 0, 0], [17, 1, 9, 0, 0], [28, 1, 16, 0, 0], [22, 2, 13, 0, 0],
    [16, 4, 9, 0, 0], [22, 2, 11, 2, 12], [28, 4, 15, 0, 0], [26, 4, 13, 1, 14],
    [26, 4, 14, 2, 15], [24, 4, 12, 4, 13], [28, 6, 15, 2, 16], [24, 3, 12, 8, 13],
    [28, 7, 14, 4, 15], [22, 12, 11, 4, 12], [24, 11, 12, 5, 13], [24, 11, 12, 7, 13],
    [30, 3, 15, 13, 16], [28, 2, 14, 17, 15], [28, 2, 14, 19, 15], [26, 9, 13, 16, 14],
    [28, 15, 15, 10, 16], [30, 19, 16, 6, 17], [24, 34, 13, 0, 0], [30, 16, 15, 14, 16],
    [30, 30, 16, 2, 17], [30, 22, 15, 13, 16], [30, 33, 16, 4, 17], [30, 12, 15, 28, 16],
    [30, 11, 15, 31, 16], [30, 19, 15, 26, 16], [30, 23, 15, 25, 16], [30, 23, 15, 28, 16],
    [30, 19, 15, 35, 16], [30, 11, 15, 46, 16], [30, 59, 16, 1, 17], [30, 22, 15, 41, 16],
    [30, 2, 15, 64, 16], [30, 24, 15, 46, 16], [30, 42, 15, 32, 16], [30, 10, 15, 67, 16],
    [30, 20, 15, 61, 16],
  ],
};

/**
 * Computes alignment pattern center coordinates for a given version using
 * the standard placement rule (ISO/IEC 18004 Annex E): first center at 6,
 * last center at (size - 7), remaining centers evenly spaced (rounded to
 * the nearest even step) between them. Version 32 uses a fixed step of 26
 * per the spec's special case. Computing this instead of hard-coding all
 * 40 rows avoids transcription errors in a rarely-cross-checked table.
 */
function computeAlignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const size = matrixSize(version);
  let step: number;
  if (version === 32) {
    step = 26;
  } else {
    step = Math.ceil((size - 13) / (2 * numAlign - 2)) * 2;
  }
  const positions = [6];
  for (let pos = size - 7; positions.length < numAlign; pos -= step) {
    positions.splice(1, 0, pos);
  }
  return positions;
}

export const ALIGNMENT_PATTERNS: number[][] = [[]];
for (let v = 1; v <= 40; v++) ALIGNMENT_PATTERNS.push(computeAlignmentPositions(v));

// Version info bits for versions 7-40 (18-bit BCH codes), index by version.
export const VERSION_INFO_POLY = 0x1f25; // generator for (18,6) BCH used by version info
export const FORMAT_INFO_POLY = 0x0537; // generator for (15,5) BCH used by format info
export const FORMAT_INFO_MASK = 0x5412;

// Remainder bits needed after final module placement, per version.
export const REMAINDER_BITS: number[] = [
  0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4,
  4, 4, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0,
];

export function matrixSize(version: number): number {
  return version * 4 + 17;
}
