# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in LombokQRCode, please email security@codinglombok.org
instead of using the public issue tracker. Please include:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if you have one)

We take security seriously and will respond within 72 hours. We'll keep your report confidential
until we've had a chance to assess and address the issue.

## Security Considerations

### What this library does
- Encodes data into QR codes and barcodes according to public standards (ISO/IEC 18004, ISO/IEC 15417)
- Renders code as SVG (no image processing, no network calls)
- Scans codes via the browser's native `BarcodeDetector` API (if available)

### What this library does NOT do
- Encrypt or obfuscate data (QR codes are always human-readable)
- Validate URLs or sanitize input (pass clean, trusted data)
- Protect sensitive information in generated codes (treat QR output as plaintext)

### Best practices when using LombokQRCode

1. **Don't encode secrets** — QR codes are easily readable. If you need to encode a token or key, use a short-lived token and require additional authentication.

2. **Sanitize SVG output** if displaying user-provided text in a template — while LombokQRCode escapes XML characters in labels, always follow your framework's XSS prevention guidelines.

3. **Validate input length** — the library will reject data that's too long for a given error-correction level, but this is a graceful error, not a security boundary.

4. **Keep the library updated** — we'll patch any implementation bugs promptly.

## Known Limitations

- **QR decoder is not included** — camera scanning relies on the browser's native `BarcodeDetector`. Use a polyfill or fallback for older browsers.
- **No ECC level enforcement** — you choose the level; there's no enforcement that sensitive data uses high error correction.
- **SVG rendering assumes trusted data** — if you're rendering user input as a label, ensure your framework escapes it.
