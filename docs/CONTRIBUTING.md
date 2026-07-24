# Contributing

This project is open-source and welcomes contributions. Before you start, please read
`ARCHITECTURE.md` and `VALIDATION.md` so you understand the codebase structure and what
"spec-compliant" actually means here (spoiler: we test it, not just assert it).

## Dev setup

```bash
git clone https://github.com/codinglombok/LombokQRCode.git
cd LombokQRCode
npm install
npm run build      # generates dist-test/ for testing
npm run lint       # typecheck
```

## Testing philosophy

**Unit tests:** The encoder is validated via integration tests (encode a string, render it,
decode it with an independent system like OpenCV, verify round-trip). There are no isolated
unit tests for, say, "Reed-Solomon EC computation" in isolation — the whole pipeline is
tested end-to-end. This is less granular but catches real bugs (e.g. a mismatch between how
we *compute* a codeword and how we *place* it in the matrix).

**Adding a test:** If you fix a bug, add a string to the encode/decode sweep in
`sweep.js` that would have caught it. If you add a feature, add test strings for the new
code paths to the same sweep.

**Real-device testing:** we don't have a CI pipeline for this yet, but if you have access to
a phone camera or barcode scanner, please test printed codes and report what works/breaks.

## Code style

- Use TypeScript strict mode; the `tsconfig.json` enforces this.
- No external runtime dependencies (dev dependencies for TypeScript are fine).
- Keep modules small; ~200–300 lines is a good target.
- Comment *why*, not *what* (the code tells you what it does; comments explain the design choice).

## Sending a PR

1. Fork and create a feature branch (`git checkout -b fix/mysterious-mask-bug`)
2. Make your changes, ensuring `npm run lint` passes
3. If you're adding a feature, add test cases to `sweep.js` (if it's encoding) or explain
   in the PR how you tested it
4. Submit a PR with a clear description of the problem and your approach

We'll review for correctness against the spec, not style nitpicks.

## Common tasks

### Add a new language to i18n

Edit `src/i18n/index.ts`:
```ts
const myLang: MessageCatalog = {
  errorTooLong: '...',
  errorUnsupportedChar: '...',
  // ...all keys from MessageCatalog
};

const catalogs = { en, id, es, myLang }; // add to export
```

### Add a new template

Edit `src/render/svg.ts`, add to `BUILTIN_TEMPLATES`:
```ts
myTemplate: {
  dotStyle: 'dots',
  cornerStyle: 'dot',
  gradient: { type: 'linear', colors: ['#fff', '#000'], angle: 90 },
}
```

### Fix a bug in the encoder

1. Write a test string that demonstrates the bug (add it to `sweep.js`)
2. Verify it fails: `node render_png.js` + decode with OpenCV
3. Fix the code
4. Re-run the sweep; confirm your test now passes
5. Run the full sweep to make sure you didn't break anything else

## Licensing

By submitting a PR, you agree that your contribution is licensed under Apache-2.0 (see LICENSE).

## Questions?

Open an issue on GitHub. We're more likely to respond to concrete bug reports ("this QR code
doesn't scan on my phone") than design questions, but it's worth asking.
