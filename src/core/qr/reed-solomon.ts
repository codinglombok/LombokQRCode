/**
 * Reed-Solomon error correction encoder over GF(256) with the
 * QR Code primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11d).
 * Clean-room implementation — standard finite-field arithmetic.
 */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** Builds the generator polynomial of given degree (coefficients, highest first). */
function generatorPolynomial(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], 1);
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

const generatorCache = new Map<number, number[]>();

/** Computes `ecLength` Reed-Solomon error-correction codewords for `data`. */
export function computeECCodewords(data: number[], ecLength: number): number[] {
  let gen = generatorCache.get(ecLength);
  if (!gen) {
    gen = generatorPolynomial(ecLength);
    generatorCache.set(ecLength, gen);
  }
  // gen is monic with length ecLength + 1 (gen[0] === 1); remainder has length ecLength.
  const remainder = new Array(ecLength).fill(0);
  for (const d of data) {
    const factor = d ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    if (factor !== 0) {
      for (let i = 0; i < ecLength; i++) {
        remainder[i] ^= gfMul(gen[i + 1], factor);
      }
    }
  }
  return remainder;
}
