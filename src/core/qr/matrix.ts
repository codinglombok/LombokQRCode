import {
  ALIGNMENT_PATTERNS,
  EC_LEVEL_BITS,
  ErrorCorrectionLevel,
  FORMAT_INFO_MASK,
  FORMAT_INFO_POLY,
  REMAINDER_BITS,
  VERSION_INFO_POLY,
  matrixSize,
} from './tables';

type Cell = { dark: boolean; isFunction: boolean };

export class QRMatrix {
  readonly size: number;
  private cells: Cell[][];

  constructor(readonly version: number) {
    this.size = matrixSize(version);
    this.cells = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => ({ dark: false, isFunction: false }))
    );
  }

  get(x: number, y: number): boolean {
    return this.cells[y][x].dark;
  }

  private set(x: number, y: number, dark: boolean, isFunction = false): void {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) return;
    this.cells[y][x] = { dark, isFunction };
  }

  isFunctionModule(x: number, y: number): boolean {
    return this.cells[y][x].isFunction;
  }

  private placeFinderPattern(cx: number, cy: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= this.size || y < 0 || y >= this.size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const dark = d !== 2 && d <= 3;
        this.set(x, y, dark, true);
      }
    }
  }

  private placeAlignmentPattern(cx: number, cy: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        this.set(cx + dx, cy + dy, d !== 1, true);
      }
    }
  }

  private placeFunctionPatterns(): void {
    // Finder patterns (top-left, top-right, bottom-left) + separators
    this.placeFinderPattern(3, 3);
    this.placeFinderPattern(this.size - 4, 3);
    this.placeFinderPattern(3, this.size - 4);
    for (let i = 0; i < 8; i++) {
      this.set(7, i, false, true);
      this.set(i, 7, false, true);
      this.set(this.size - 8, i, false, true);
      this.set(this.size - 1 - i, 7, false, true);
      this.set(7, this.size - 1 - i, false, true);
      this.set(i, this.size - 8, false, true);
    }

    // Timing patterns
    for (let i = 8; i < this.size - 8; i++) {
      const dark = i % 2 === 0;
      this.set(i, 6, dark, true);
      this.set(6, i, dark, true);
    }

    // Alignment patterns
    const positions = ALIGNMENT_PATTERNS[this.version];
    for (const cy of positions) {
      for (const cx of positions) {
        // Skip positions overlapping the finder patterns
        const nearTopLeft = cx <= 8 && cy <= 8;
        const nearTopRight = cx >= this.size - 9 && cy <= 8;
        const nearBottomLeft = cx <= 8 && cy >= this.size - 9;
        if (nearTopLeft || nearTopRight || nearBottomLeft) continue;
        this.placeAlignmentPattern(cx, cy);
      }
    }

    // Dark module (always present)
    this.set(8, this.size - 8, true, true);

    // Reserve format info areas (filled in later with actual bits)
    for (let i = 0; i < 9; i++) {
      if (i !== 6) {
        this.set(8, i, false, true);
        this.set(i, 8, false, true);
      }
    }
    for (let i = 0; i < 8; i++) {
      this.set(this.size - 1 - i, 8, false, true);
      this.set(8, this.size - 1 - i, false, true);
    }

    // Reserve version info areas (versions 7+)
    if (this.version >= 7) {
      for (let x = 0; x < 6; x++) {
        for (let y = 0; y < 3; y++) {
          this.set(this.size - 11 + y, x, false, true);
          this.set(x, this.size - 11 + y, false, true);
        }
      }
    }
  }

  private placeData(codewords: number[], maskFn: (x: number, y: number) => boolean): void {
    let bitIndex = 0;
    const bits: number[] = [];
    for (const b of codewords) {
      for (let i = 7; i >= 0; i--) bits.push((b >>> i) & 1);
    }

    let col = this.size - 1;
    let dirUp = true;
    while (col > 0) {
      if (col === 6) col--; // skip vertical timing column
      for (let i = 0; i < this.size; i++) {
        const y = dirUp ? this.size - 1 - i : i;
        for (const x of [col, col - 1]) {
          if (this.cells[y][x].isFunction) continue;
          const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
          bitIndex++;
          const dark = maskFn(x, y) ? bit === 0 : bit === 1;
          this.set(x, y, dark, false);
        }
      }
      dirUp = !dirUp;
      col -= 2;
    }
  }

  private applyFormatInfo(level: ErrorCorrectionLevel, maskId: number): void {
    const data = (EC_LEVEL_BITS[level] << 3) | maskId;
    let bch = data << 10;
    while (bitLength(bch) - bitLength(FORMAT_INFO_POLY) >= 0) {
      bch ^= FORMAT_INFO_POLY << (bitLength(bch) - bitLength(FORMAT_INFO_POLY));
    }
    const bits = ((data << 10) | bch) ^ FORMAT_INFO_MASK;

    for (let i = 0; i <= 5; i++) this.set(8, i, ((bits >> i) & 1) === 1, true);
    this.set(8, 7, ((bits >> 6) & 1) === 1, true);
    this.set(8, 8, ((bits >> 7) & 1) === 1, true);
    this.set(7, 8, ((bits >> 8) & 1) === 1, true);
    for (let i = 9; i <= 14; i++) this.set(14 - i, 8, ((bits >> i) & 1) === 1, true);

    for (let i = 0; i <= 7; i++) this.set(this.size - 1 - i, 8, ((bits >> i) & 1) === 1, true);
    for (let i = 8; i <= 14; i++) this.set(8, this.size - 15 + i, ((bits >> i) & 1) === 1, true);
  }

  private applyVersionInfo(): void {
    if (this.version < 7) return;
    let bch = this.version << 12;
    while (bitLength(bch) - bitLength(VERSION_INFO_POLY) >= 0) {
      bch ^= VERSION_INFO_POLY << (bitLength(bch) - bitLength(VERSION_INFO_POLY));
    }
    const bits = (this.version << 12) | bch;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >> i) & 1) === 1;
      const a = Math.floor(i / 3);
      const b = i % 3;
      this.set(this.size - 11 + b, a, dark, true);
      this.set(a, this.size - 11 + b, dark, true);
    }
  }

  static build(
    codewords: number[],
    version: number,
    level: ErrorCorrectionLevel,
    maskId?: number
  ): QRMatrix {
    const base = new QRMatrix(version);
    base.placeFunctionPatterns();

    if (maskId !== undefined) {
      base.placeData(codewords, maskFunction(maskId));
      base.applyFormatInfo(level, maskId);
      base.applyVersionInfo();
      return base;
    }

    // Try all 8 masks, keep lowest penalty
    let best: { matrix: QRMatrix; penalty: number } | null = null;
    for (let m = 0; m < 8; m++) {
      const candidate = new QRMatrix(version);
      candidate.placeFunctionPatterns();
      candidate.placeData(codewords, maskFunction(m));
      candidate.applyFormatInfo(level, m);
      candidate.applyVersionInfo();
      const penalty = candidate.penaltyScore();
      if (!best || penalty < best.penalty) best = { matrix: candidate, penalty };
    }
    return best!.matrix;
  }

  private penaltyScore(): number {
    let penalty = 0;
    const n = this.size;
    // Rule 1: runs of 5+ same-color modules in a row/column
    for (let y = 0; y < n; y++) penalty += runPenalty((x) => this.cells[y][x].dark, n);
    for (let x = 0; x < n; x++) penalty += runPenalty((y) => this.cells[y][x].dark, n);
    // Rule 2: 2x2 blocks of same color
    for (let y = 0; y < n - 1; y++) {
      for (let x = 0; x < n - 1; x++) {
        const c = this.cells[y][x].dark;
        if (
          c === this.cells[y][x + 1].dark &&
          c === this.cells[y + 1][x].dark &&
          c === this.cells[y + 1][x + 1].dark
        ) {
          penalty += 3;
        }
      }
    }
    // Rule 3: finder-like patterns 1:1:3:1:1
    const pattern = [true, false, true, true, true, false, true];
    for (let y = 0; y < n; y++) penalty += patternPenalty((x) => this.cells[y][x].dark, n, pattern);
    for (let x = 0; x < n; x++) penalty += patternPenalty((y) => this.cells[y][x].dark, n, pattern);
    // Rule 4: overall dark ratio
    let dark = 0;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (this.cells[y][x].dark) dark++;
    const percent = (dark * 100) / (n * n);
    penalty += Math.floor(Math.abs(percent - 50) / 5) * 10;
    return penalty;
  }

  toBooleanGrid(): boolean[][] {
    return this.cells.map((row) => row.map((c) => c.dark));
  }
}

function bitLength(n: number): number {
  return n === 0 ? 0 : 32 - Math.clz32(n);
}

function maskFunction(id: number): (x: number, y: number) => boolean {
  switch (id) {
    case 0: return (x, y) => (x + y) % 2 === 0;
    case 1: return (_x, y) => y % 2 === 0;
    case 2: return (x) => x % 3 === 0;
    case 3: return (x, y) => (x + y) % 3 === 0;
    case 4: return (x, y) => (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5: return (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6: return (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    case 7: return (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    default: throw new Error(`Invalid mask id ${id}`);
  }
}

function runPenalty(get: (i: number) => boolean, n: number): number {
  let penalty = 0;
  let runColor = get(0);
  let runLength = 1;
  for (let i = 1; i < n; i++) {
    const v = get(i);
    if (v === runColor) {
      runLength++;
    } else {
      if (runLength >= 5) penalty += 3 + (runLength - 5);
      runColor = v;
      runLength = 1;
    }
  }
  if (runLength >= 5) penalty += 3 + (runLength - 5);
  return penalty;
}

function patternPenalty(get: (i: number) => boolean, n: number, pattern: boolean[]): number {
  let penalty = 0;
  const plen = pattern.length;
  for (let i = 0; i <= n - plen; i++) {
    let match = true;
    for (let j = 0; j < plen; j++) {
      if (get(i + j) !== pattern[j]) { match = false; break; }
    }
    if (match) {
      // Require 4 light modules of padding on at least one side (simplified per spec intent)
      const beforeLight = i - 4 < 0 || Array.from({ length: 4 }, (_, k) => get(i - 1 - k) === false).every(Boolean);
      const afterLight = i + plen + 3 >= n || Array.from({ length: 4 }, (_, k) => get(i + plen + k) === false).every(Boolean);
      if (beforeLight || afterLight) penalty += 40;
    }
  }
  return penalty;
}
