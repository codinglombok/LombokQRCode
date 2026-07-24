# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-07-22

### Added

- **QR Encoder** — ISO/IEC 18004 compliant, versions 1–40, all 4 error-correction levels (L/M/Q/H)
  - Numeric mode (0–9)
  - Alphanumeric mode (45-char set)
  - Byte mode (UTF-8 support for CJK, emoji, etc.)
  - Automatic version and mode selection
  - All 8 mask patterns with penalty scoring
- **Code128 Barcode Encoder** — ISO/IEC 15417 compliant
  - Subsets A/B/C with automatic switching
  - Full ASCII support (characters 0–127)
  - Checksum validation
- **SVG Rendering**
  - 6 built-in templates (classic, rounded, dots, ocean, sunset, midnight)
  - Customizable dot styles and corner styles
  - Linear and radial gradients
  - Logo embedding with background inset option
  - Configurable quiet zones and module sizes
- **i18n Support** — Message catalogs in 11 languages
  - English, Indonesian, Spanish, French, German, Portuguese
  - Japanese, Chinese (Simplified), Arabic, Russian, Hindi
- **Camera Scanning** — Browser wrapper for native `BarcodeDetector` API
- **Full TypeScript support** — Strict mode, declaration files, source maps
- **Zero runtime dependencies** — All code is vanilla TypeScript
- **Comprehensive documentation**
  - API reference
  - Architecture guide
  - Validation report (test results)
  - Deployment guide
  - Roadmap (honest scope)
  - Contributing guidelines
- **Examples** for Vanilla JS, React, Vue 3, and Node.js/Express
- **CI/CD** — GitHub Actions workflows for build, test, and npm publish
- **Docker** support for containerized deployment

### Known Limitations

- **Camera decoder not included** — scanning uses browser's native `BarcodeDetector`; fallback needed for older browsers
- **No native ports yet** — Java, Go, Rust, Python are on the roadmap
- **Kanji mode not implemented** — Japanese text encodes via UTF-8 byte mode (less compact)
- **No mixed-mode segmentation** — single mode chosen for entire input
- **Canvas/PNG renderer not included** — SVG output only (rasterize externally if needed)

### Validated

- ✅ 160/160 error-correction block table rows verified
- ✅ 117/117 QR codes decoded correctly (15 versions × 4 levels × 3 modes)
- ✅ 9/9 Code128 round-trip encode/decode tests passed
- ✅ Tested against OpenCV's QRCodeDetectorAruco (independent verification)
- ⚠️  Real-device scan testing pending (see Roadmap)

## [Unreleased]

Planned for future releases:

- Pure-JS camera decoder (finder-pattern detection, perspective correction, bit sampling)
- Native Java/Go/Rust/Python implementations
- Canvas/PNG renderer
- Kanji mode (Shift-JIS)
- Mixed-mode segmentation
- Structured Append (multi-symbol data)
- Micro QR / rMQR support
- Performance benchmarking guide
- Additional template presets

---

For details on what was tested and validation methodology, see [docs/VALIDATION.md](docs/VALIDATION.md).
