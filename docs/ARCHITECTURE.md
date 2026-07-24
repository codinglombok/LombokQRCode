# Architecture

## Module layout

```
src/
  core/
    qr/
      tables.ts       Spec constants: EC block table, alignment formula, BCH polynomials
      segments.ts      Text -> bit stream (numeric/alphanumeric/byte mode), version selection
      reed-solomon.ts  GF(256) arithmetic, generator polynomial, EC codeword computation
      matrix.ts        Module placement: finder/timing/alignment patterns, masking, penalty scoring
      encoder.ts       Ties the above together: encodeQR(text, options) -> boolean[][]
    barcode/
      code128.ts       Code128 subset A/B/C encoding with automatic mode switching
  render/
    svg.ts             QR -> styled SVG (templates, gradients, logos, dot/corner styles)
    barcode-svg.ts     Code128 -> SVG
  i18n/
    index.ts           Message catalogs (11 locales)
  capture/
    camera.ts          Browser camera + BarcodeDetector wrapper
  index.ts             Public API surface
```

## QR encoding pipeline

1. **Mode detection** (`segments.ts`): scans the input to pick the most compact mode —
   numeric (digits only) > alphanumeric (a fixed 45-character set) > byte (UTF‑8, anything else).
2. **Version selection**: tries versions 1–40 in order, encoding the segment at each version's
   character-count-indicator width, until the bit stream fits the requested error-correction
   level's data capacity. This is a "smallest that fits" strategy, not an information-theoretic
   optimum — mixed-mode segmentation (switching modes mid-string for a shorter encoding) is not
   implemented; see [ROADMAP.md](ROADMAP.md).
3. **Padding**: terminator bits, bit-align to a byte boundary, then alternating `0xEC`/`0x11`
   pad bytes to fill the version's data capacity exactly.
4. **Reed-Solomon** (`reed-solomon.ts`): data codewords are split into blocks per the EC table,
   and each block gets its own EC codewords via polynomial long division in GF(256) with the
   QR primitive polynomial `x^8 + x^4 + x^3 + x^2 + 1`.
5. **Interleaving**: data codewords are read column-first across blocks (all block-0 bytes,
   then all block-1 bytes, ...), then all EC codewords the same way — this is what lets a
   scanner recover from damage localized to one physical region.
6. **Matrix placement** (`matrix.ts`): finder patterns (three corners), separators, timing
   patterns (row/column 6), alignment patterns (computed via the standard formula, not a
   hard-coded table — see [VALIDATION.md](VALIDATION.md) for why), the fixed dark module, and
   reserved format/version-info areas are placed first. Data bits are then placed in the
   standard zigzag column-pair pattern, skipping every function module.
7. **Masking**: all 8 mask patterns are tried; each candidate's penalty score (four ISO/IEC
   18004 penalty rules: same-color runs, 2×2 blocks, finder-like ratios, and overall dark/light
   balance) is computed, and the lowest-penalty candidate is kept.
8. **Format/version info**: written last, using BCH(15,5) for format info (error-correction
   level + mask pattern) and BCH(18,6) for version info (versions 7+).

## Code128 pipeline

Text is split into runs; a run of 4+ consecutive digits switches to subset C (pairs of digits
packed into one symbol each — twice the density), otherwise subset B (full printable ASCII) is
used. A checksum (start value + Σ(symbol value × position), mod 103) is appended, followed by
the fixed stop pattern.

## Why SVG-first for rendering?

SVG output is resolution-independent, trivially themeable (CSS variables, gradients), and
needs no canvas/image-buffer dependency to produce — it works identically in Node (write to
disk) and the browser (inject into the DOM). A canvas/PNG renderer is straightforward to layer
on top of the same `QRCodeResult`/`Code128Result` data and is tracked in the roadmap.
