import { EC_BLOCK_INFO, ErrorCorrectionLevel } from './tables';
import { buildDataCodewords } from './segments';
import { computeECCodewords } from './reed-solomon';
import { QRMatrix } from './matrix';

export interface QREncodeOptions {
  errorCorrectionLevel?: ErrorCorrectionLevel;
  minVersion?: number;
  maxVersion?: number;
}

export interface QRCodeResult {
  version: number;
  errorCorrectionLevel: ErrorCorrectionLevel;
  size: number;
  modules: boolean[][]; // [y][x], true = dark
}

function interleaveBlocks(dataCodewords: number[], version: number, level: ErrorCorrectionLevel): number[] {
  const [ecLen, g1Blocks, g1Data, g2Blocks, g2Data] = EC_BLOCK_INFO[level][version];

  const dataBlocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (let i = 0; i < g1Blocks; i++) {
    const block = dataCodewords.slice(offset, offset + g1Data);
    offset += g1Data;
    dataBlocks.push(block);
    ecBlocks.push(computeECCodewords(block, ecLen));
  }
  for (let i = 0; i < g2Blocks; i++) {
    const block = dataCodewords.slice(offset, offset + g2Data);
    offset += g2Data;
    dataBlocks.push(block);
    ecBlocks.push(computeECCodewords(block, ecLen));
  }

  const maxDataLen = Math.max(g1Data, g2Data);
  const interleaved: number[] = [];
  for (let i = 0; i < maxDataLen; i++) {
    for (const block of dataBlocks) if (i < block.length) interleaved.push(block[i]);
  }
  for (let i = 0; i < ecLen; i++) {
    for (const block of ecBlocks) interleaved.push(block[i]);
  }
  return interleaved;
}

/**
 * Encodes `text` into a QR Code symbol. Automatically picks the smallest
 * version that fits at the requested error-correction level (default 'M'),
 * and the mask pattern with the lowest ISO/IEC 18004 penalty score.
 */
export function encodeQR(text: string, options: QREncodeOptions = {}): QRCodeResult {
  const level = options.errorCorrectionLevel ?? 'M';
  const { version, codewords } = buildDataCodewords(
    text,
    level,
    options.minVersion ?? 1,
    options.maxVersion ?? 40
  );
  const interleaved = interleaveBlocks(codewords, version, level);
  const matrix = QRMatrix.build(interleaved, version, level);
  return {
    version,
    errorCorrectionLevel: level,
    size: matrix.size,
    modules: matrix.toBooleanGrid(),
  };
}
