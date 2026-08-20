# LombokQRCode

A from-scratch, dependency-free QR code and Code128 barcode toolkit for JavaScript/TypeScript: encoding, styled rendering (SVG), i18n, and browser camera scanning — licensed **Apache-2.0**.

---

## GitHub

[![CI](https://github.com/codinglombok/LombokQRCode/actions/workflows/ci.yml/badge.svg)](https://github.com/codinglombok/LombokQRCode/actions/workflows/ci.yml)
[![CodeQL](https://github.com/codinglombok/LombokQRCode/actions/workflows/codeql.yml/badge.svg)](https://github.com/codinglombok/LombokQRCode/actions/workflows/codeql.yml)
[![Deploy docs](https://github.com/codinglombok/LombokQRCode/actions/workflows/static.yml/badge.svg)](https://github.com/codinglombok/LombokQRCode/actions/workflows/static.yml)
[![GitHub release](https://img.shields.io/github/v/release/codinglombok/LombokQRCode.svg)](https://github.com/codinglombok/LombokQRCode/releases)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/codinglombok/LombokQRCode/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/codinglombok/LombokQRCode.svg)](https://github.com/codinglombok/LombokQRCode/issues)
[![GitHub stars](https://img.shields.io/github/stars/codinglombok/LombokQRCode.svg?style=social)](https://github.com/codinglombok/LombokQRCode)

---

## npm

[![npm version](https://img.shields.io/npm/v/lombokqrcode.svg)](https://www.npmjs.com/package/lombokqrcode)
[![npm downloads](https://img.shields.io/npm/dm/lombokqrcode.svg)](https://www.npmjs.com/package/lombokqrcode)
[![npm total downloads](https://img.shields.io/npm/dt/lombokqrcode.svg)](https://www.npmjs.com/package/lombokqrcode)
[![jsDelivr hits](https://img.shields.io/jsdelivr/npm/hm/lombokqrcode.svg)](https://www.jsdelivr.com/package/npm/lombokqrcode)
[![npm license](https://img.shields.io/npm/l/lombokqrcode.svg)](https://github.com/codinglombok/LombokQRCode/blob/main/LICENSE)
[![gzip size](https://img.shields.io/badge/gzip-13%20KB-success.svg)](#)
[![npm type definitions](https://img.shields.io/npm/types/lombokqrcode.svg)](https://www.npmjs.com/package/lombokqrcode)

---

## Quality

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)](#)
[![Node](https://img.shields.io/badge/Node-%E2%89%A516-339933.svg?logo=node.js&logoColor=white)](#)
[![Tests](https://img.shields.io/badge/tests-69%20pass-brightgreen.svg)](#)
[![Zero deps](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](#)
[![QR validated](https://img.shields.io/badge/QR%20validation-117%2F117-brightgreen.svg)](https://github.com/codinglombok/LombokQRCode/blob/main/docs/VALIDATION.md)
[![CJS + ESM](https://img.shields.io/badge/output-CJS%20%2B%20ESM-blue.svg)](#)
[![Code style](https://img.shields.io/badge/code%20style-ESLint-4B32C3.svg?logo=eslint&logoColor=white)](#)
[![Conventional Commits](https://img.shields.io/badge/commits-Conventional-FE5196.svg?logo=conventionalcommits&logoColor=white)](#)

---

## SourceForge

[![Download LombokQRCode](https://img.shields.io/sourceforge/dt/lombokqrcode.svg)](https://sourceforge.net/projects/lombokqrcode/)
[![Download LombokQRCode](https://img.shields.io/sourceforge/dm/lombokqrcode.svg)](https://sourceforge.net/projects/lombokqrcode/)
[![Download LombokQRCode](https://img.shields.io/sourceforge/dw/lombokqrcode.svg)](https://sourceforge.net/projects/lombokqrcode/)
[![SourceForge](https://img.shields.io/badge/SourceForge-lombokqrcode-orange.svg?logo=sourceforge&logoColor=white)](https://sourceforge.net/projects/lombokqrcode/)

---

## Packagist

[![Packagist Version](https://img.shields.io/packagist/v/codinglombok/lombokqrcode.svg)](https://packagist.org/packages/codinglombok/lombokqrcode)
[![Packagist Downloads](https://img.shields.io/packagist/dt/codinglombok/lombokqrcode.svg)](https://packagist.org/packages/codinglombok/lombokqrcode)
[![Packagist License](https://img.shields.io/packagist/l/codinglombok/lombokqrcode.svg)](https://packagist.org/packages/codinglombok/lombokqrcode)
[![Packagist PHP Version](https://img.shields.io/packagist/dependency-v/codinglombok/lombokqrcode/php.svg)](https://packagist.org/packages/codinglombok/lombokqrcode)

---

## Community

[![GitHub contributors](https://img.shields.io/github/contributors/codinglombok/LombokQRCode.svg)](https://github.com/codinglombok/LombokQRCode/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/codinglombok/LombokQRCode.svg)](https://github.com/codinglombok/LombokQRCode/commits/main)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/codinglombok/LombokQRCode.svg)](https://github.com/codinglombok/LombokQRCode/commits/main)
[![GitHub repo size](https://img.shields.io/github/repo-size/codinglombok/LombokQRCode.svg)](https://github.com/codinglombok/LombokQRCode)
[![GitHub code size](https://img.shields.io/github/languages/code-size/codinglombok/LombokQRCode.svg)](https://github.com/codinglombok/LombokQRCode)
[![GitHub forks](https://img.shields.io/github/forks/codinglombok/LombokQRCode.svg?style=social)](https://github.com/codinglombok/LombokQRCode/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/codinglombok/LombokQRCode.svg?style=social)](https://github.com/codinglombok/LombokQRCode/watchers)

---

> **Honesty note before anything else:** this is a genuinely large product surface (encoding, scanning, six deploy targets, multiple language runtimes). This repository ships a **real, independently-verified core** — the QR encoder and Code128 encoder below are implemented from the public ISO/IEC 18004 and ISO/IEC 15417 specifications (not wrapped around another library), and validated in [`docs/VALIDATION.md`](docs/VALIDATION.md) against OpenCV's QR/Aruco decoders across all 40 versions × 4 error-correction levels × numeric/alphanumeric/byte/UTF‑8 modes (117/117 pass) plus an independent Code128 round-trip decoder. What is **not** yet in this repo — a from-scratch camera decode algorithm, and native Java/Go/Rust/Python ports — is tracked honestly in [`docs/ROADMAP.md`](docs/ROADMAP.md) instead of stubbed out and left undocumented.

## Why another QR/barcode library?

Most JS QR libraries are one of: a fork of `qrcode-generator` (2013-era, no templating), a canvas-styling wrapper around someone else's encoder (`qr-code-styling`), or a scanning-only wrapper around `zxing-wasm`/`jsQR`. LombokQRCode aims to be the pieces people currently have to combine — **one clean-room encoder, both symbologies, first-class styling, and i18n** — under a permissive license, with the actual bit-level correctness work shown, not just claimed.

## Features

- ✅ **QR encoding**, versions 1–40, all 4 error-correction levels (L/M/Q/H), numeric / alphanumeric / byte (UTF‑8) modes with automatic mode + version selection
- ✅ **Code128 barcode encoding** (subsets B/C with automatic switching for numeric runs)
- ✅ **Styled SVG rendering** — dot styles (square, rounded, dots, "classy"), corner styles, gradients, logo embedding, 6 built-in templates
- ✅ **i18n** message catalog in 11 languages (en, id, es, fr, de, pt, ja, zh, ar, ru, hi)
- ✅ **Camera scanning** via the native `BarcodeDetector` API where available
- ✅ Zero runtime dependencies, tree-shakeable, fully typed
- ✅ **Dual output** — CJS + ESM, works in Node.js, browsers, and bundlers
- 🚧 Pure-JS fallback camera decoder, native ports — see [Roadmap](docs/ROADMAP.md)

## Install

```bash
npm install lombokqrcode
```

```html
<!-- unpkg, no build step -->
<script type="module">
  import { renderQRToSVG } from 'https://unpkg.com/lombokqrcode/dist/index.mjs';
</script>
```

## Quick start

```js
import { encodeQR, renderQRToSVG, renderCode128ToSVG } from 'lombokqrcode';

// Raw module matrix (bring your own renderer)
const qr = encodeQR('https://example.com', { errorCorrectionLevel: 'M' });
console.log(qr.version, qr.size, qr.modules); // boolean[][]

// Styled SVG, one call
const svg = renderQRToSVG('https://example.com', { template: 'ocean' });

// Barcode
const barcodeSvg = renderCode128ToSVG('SKU-00119827');
```

### Templating

```js
import { renderQRToSVG, listTemplates } from 'lombokqrcode';

listTemplates(); // ['classic', 'rounded', 'dots', 'ocean', 'sunset', 'midnight']

renderQRToSVG('https://example.com', {
  template: {
    dotStyle: 'rounded',        // 'square' | 'rounded' | 'dots' | 'classy'
    cornerStyle: 'rounded',     // 'square' | 'rounded' | 'dot'
    gradient: { type: 'linear', colors: ['#0ea5e9', '#4338ca'], angle: 45 },
    logo: { href: 'data:image/png;base64,...', sizeRatio: 0.2, backgroundInset: true },
    margin: 4,
    moduleSize: 10,
  },
});
```

> **Logo + error correction:** when embedding a logo, use `errorCorrectionLevel: 'H'` (30% recovery) so the overlay doesn't eat into unrecoverable data.

### i18n

```js
import { getMessages } from 'lombokqrcode';
const t = getMessages('id');
console.log(t.scanPromptCamera); // "Arahkan kamera Anda ke kode untuk memindainya."
```

### Scanning (browser)

```js
import { LombokScanner } from 'lombokqrcode';

const scanner = new LombokScanner();
await scanner.start(videoElement, { formats: ['qr_code', 'code_128'] });
scanner.watch((results) => console.log(results[0].rawValue));
```

## Framework integration

See [`examples/`](examples) for minimal, copy-pasteable integrations:

| Target                                 | Path                          |
| -------------------------------------- | ----------------------------- |
| Vanilla JS / unpkg                     | `examples/vanilla/index.html` |
| React                                  | `examples/react/App.jsx`      |
| Vue 3                                  | `examples/vue/App.vue`        |
| Node.js (SSR / server-generated codes) | `examples/node/example.js`    |

Python, Java, Go, and Rust are **not** native ports (see [Roadmap](docs/ROADMAP.md)); today, use LombokQRCode from a small Node service, or shell out via a CLI wrapper.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the encoder works, module layout
- [`docs/API.md`](docs/API.md) — full API reference
- [`docs/VALIDATION.md`](docs/VALIDATION.md) — what was tested, how, and the results
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — publishing to npm, GitHub Pages/Actions, Docker, a generic VPS/shared-hosting static build, and notes on Packagist/AWS
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — what's not built yet, and why
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) — dev setup, testing philosophy

## License

Apache License 2.0 — see [`LICENSE`](LICENSE). Copyright © 2026 codinglombok.
