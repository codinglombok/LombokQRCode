# Performance

This document covers encoding speed, bundle size, and tips for optimization.

## Encoding Speed

LombokQRCode encodes synchronously (no async needed). Rough benchmarks on modern hardware:

| Input | Mode | Size | Encoding | Rendering |
|---|---|---|---|---|
| Short URL (50 bytes) | byte | v2 | <1ms | <5ms |
| Long URL (200 bytes) | byte | v5 | <1ms | <10ms |
| SKU (20 chars) | alphanumeric | v1 | <0.5ms | <2ms |
| 1000 digits | numeric | v10 | <2ms | <15ms |

**Note:** these are synthetic measurements in a controlled environment. Your mileage varies based on:
- JavaScript engine (V8 vs SpiderMonkey vs JSC)
- CPU clock speed
- Whether JIT compilation has kicked in (first call is slower)

## Bundle Size

After tree-shaking, typical import footprints:

| Import | Size (minified) | Size (gzipped) |
|---|---|---|
| `{ encodeQR }` only | ~8 KB | ~3 KB |
| `{ encodeQR, renderQRToSVG }` | ~12 KB | ~4.5 KB |
| Full library | ~25 KB | ~8 KB |
| With scanner + i18n | ~30 KB | ~10 KB |

(These are rough; run `npm run build && du -sh dist/` for exact figures on your build.)

## Optimization Tips

### 1. **Import only what you need**

```ts
// Good (tree-shakeable)
import { encodeQR } from 'lombokqrcode';

// Avoid (imports the whole library)
import * as lom from 'lombokqrcode';
```

### 2. **Generate once, render multiple times**

```ts
const qrData = encodeQR(text, { errorCorrectionLevel: 'M' });

const svg1 = matrixToSVG(qrData, 'classic');
const svg2 = matrixToSVG(qrData, 'ocean');  // Free, reuses the matrix
```

### 3. **Use appropriate error-correction levels**

- `L` — 7% recovery, smallest codes, fastest
- `M` — 15% recovery, balance (default)
- `Q` — 25% recovery, larger codes
- `H` — 30% recovery, largest codes, but handles logo embedding

For speed and size, use `L` if you don't need resilience.

### 4. **Batch encoding on the server**

Generate codes server-side (Node), cache as SVG strings, serve static files. This avoids shipping encoding logic to the browser.

```ts
// server.js
app.get('/qr/:text', (req, res) => {
  res.set('Cache-Control', 'public, max-age=31536000');
  res.send(renderQRToSVG(req.params.text));
});
```

### 5. **Lazy-load the scanner**

Only import `LombokScanner` when the user clicks a "scan" button:

```ts
button.addEventListener('click', async () => {
  const { LombokScanner } = await import('lombokqrcode');
  const scanner = new LombokScanner();
  // ...
});
```

## What's already optimized

- **Constant tables are precomputed** — no runtime polynomial generation
- **Alignment patterns use a formula** — not a 40-row lookup table (smaller + no transcription bugs)
- **GF(256) tables cached** — generator polynomials computed once per EC length
- **No external dependencies** — one fewer HTTP request, no transitive security surface
- **Full tree-shaking** — unused code is dropped by bundlers

## Known slow paths

- **Large QR codes** (v35–40) with high error-correction: ~5–10ms (still sub-human-perception)
- **Mask evaluation** (trying all 8 patterns): necessary for spec compliance; can't skip
- **SVG rendering** (especially for large codes or many dots): render to SVG once, cache, reuse

## Profiling

To profile your own usage:

```ts
console.time('qr');
const qr = encodeQR(text);
console.timeEnd('qr');

console.time('svg');
const svg = matrixToSVG(qr, 'ocean');
console.timeEnd('svg');
```

If you find a genuine bottleneck, open an issue with:
1. The input text and parameters
2. The measured time and your hardware
3. Browser/Node.js version
