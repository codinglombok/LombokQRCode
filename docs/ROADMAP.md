# Roadmap

Listed here instead of silently omitted, so scope is never a surprise.

## Not yet implemented

- **Pure-JS camera decoder.** Scanning currently relies on the browser's native
  `BarcodeDetector` API (Chrome/Edge/Android WebView; partial Safari 17+ support). A
  from-scratch decoder — finder-pattern detection in a video frame, perspective correction,
  module sampling, Reed-Solomon error correction on the read — is a substantial project in its
  own right (comparable in size to the encoder shipped here) and is not included. Until it
  lands, browsers without `BarcodeDetector` get a clear, catchable error from
  `LombokScanner.start()` rather than a silent failure.
- **Native ports to Java, Go, Rust, Python.** These would be separate implementations (or
  WASM builds of this TypeScript core), not automatic translations, and each needs its own
  spec-compliance validation pass like the one in `VALIDATION.md`. None exist yet.
- **Kanji mode.** QR's dedicated Shift-JIS-based Kanji mode (denser than byte mode for
  Japanese text) isn't implemented; Japanese text currently encodes correctly but less
  compactly via byte/UTF‑8 mode.
- **Mixed-mode segmentation.** The encoder picks one mode for the whole input (numeric >
  alphanumeric > byte). Splitting a string into per-substring optimal segments (e.g. numeric
  for a digit run embedded in a URL) would shave a few bytes off some inputs but isn't
  implemented.
- **Canvas/PNG renderer.** Only SVG output ships today. A canvas renderer (for direct
  `<canvas>` painting or PNG export without an SVG-to-raster step) is straightforward to add
  on top of the same `QRCodeResult` data and is the next planned addition.
- **Micro QR / rMQR.** Only standard QR (versions 1–40) is supported.
- **Structured Append** (splitting data across multiple QR symbols) is not implemented.
- **Barcode image-based validation.** See `docs/VALIDATION.md` — Code128 is validated via an
  independent bit-level round-trip decoder, not yet via an image-based scanner in this
  environment.

## Deployment targets described but not yet wired up as one-click

`docs/DEPLOYMENT.md` documents how to publish this package to npm, GitHub Actions/Pages,
Docker Hub, a generic VPS or shared host (static build), Packagist (via a thin PHP wrapper,
not a native port), and notes for AWS. The GitHub Actions workflows in `.github/workflows/`
cover CI (build + typecheck) and npm publish; Docker and static-host deployment are documented
as manual steps you can turn into your own workflow once you've decided on a specific
target (S3 bucket name, VPS host, etc.) — those specifics aren't guessable from here.

## If you want to help

The most valuable next contribution is almost certainly **real-device scan testing** — printed
QR codes and barcodes across phone cameras and dedicated scanners — since everything so far
has been validated against synthetic images in a sandboxed environment (see `VALIDATION.md`).
