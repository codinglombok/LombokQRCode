# Validation

This document exists so nobody has to take "it's spec-compliant" on faith. It records what
was actually tested, against what, and what the limitations of that testing are.

## QR encoder

**Method:** every candidate matrix was rendered to a real PNG (via a from-scratch, dependency-free
PNG encoder — no image library involved) and decoded with two independent OpenCV decoders:
`cv2.QRCodeDetector` (legacy) and `cv2.QRCodeDetectorAruco` (modern). Reed-Solomon block tables
were additionally cross-checked line-by-line against the published ISO/IEC 18004 error-correction
table (Total codewords per version/level must equal `Σ(group_blocks × group_data) + ecPerBlock × totalBlocks`
for all 160 version×level combinations — verified programmatically, not by eye).

**Results:**

| Test | Coverage | Result |
|---|---|---|
| EC block table self-consistency | 40 versions × 4 levels = 160 combos | 160/160 pass |
| Version-info BCH self-consistency | versions 7–40 | 34/34 pass, cross-checked against known reference (v7 = `0x07C94`) |
| Format-info BCH self-consistency | 4 levels × 8 masks = 32 combos | 32/32 pass |
| Broad encode/decode sweep | 15 versions × 4 EC levels × 3 modes (numeric/alphanumeric/byte incl. UTF‑8 emoji/CJK) = 117 generated codes | 117/117 decoded correctly via `QRCodeDetectorAruco` |
| Targeted large-payload test | v18-H, 433-char alphanumeric payload | pass |

**A bug this process caught:** an early hand-transcribed error-correction block table had
incorrect values for Level Q at versions 11–40 (the values matched the *total codeword count*
by coincidence in some rows but not the actual block split), which would have produced QR
codes that looked structurally valid but failed to decode on real scanners. It was caught by
the self-consistency check above and corrected against the primary source table before this
release. This is exactly the kind of silent, hard-to-notice bug that a "looks right" review
would miss — which is why the check is automated and documented here rather than asserted.

**Known limitation of this validation:** everything above was tested against synthetic PNGs
generated in a sandboxed, headless environment. It has **not** been tested against a physical
phone camera, a laser scanner, low-contrast printing, or a curved/rotated surface. Please treat
it as "correct per spec, unverified in the physical world" until you've scanned a printed
sample with your own devices — and please open an issue if you find a real-world failure.

## Code128 barcode encoder

**Method:** an independent decoder (built directly from the standard Code128 pattern table,
separate from the encoder's mode-switching/checksum logic) round-trips every test string back
to the original text, validating the checksum algorithm and subset-B/C switching logic.
OpenCV's `barcode_BarcodeDetector` module was attempted as a second, image-based check but its
model assets were not available in the sandboxed test environment, so that leg of validation
could not be completed here — **this is a gap, not a pass**, and is called out rather than
glossed over. If you scan a generated barcode with a real device and it doesn't work, please
file an issue with the input string.

**Results:** 9/9 round-trip tests passed (plain text, all-numeric, mixed alphanumeric, single
character, punctuation).

## What "clean-room" means here

The QR and Code128 tables in this repository (capacities, alignment-pattern formula,
generator-polynomial degrees) are the same numeric parameters published in the ISO standards
and reproduced in every compliant implementation (zxing, jsQR, node `qrcode`, etc.) — these are
factual specification values, not another project's copyrightable expression. The alignment
pattern positions are computed from the standard placement formula rather than hard-coded,
specifically to avoid the kind of transcription error described above. All algorithmic code
(bit-stream construction, Reed-Solomon GF(256) arithmetic, matrix placement, mask scoring,
Code128 subset switching) was written directly against the specification, not adapted from an
existing implementation's source.
