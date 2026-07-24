# API Reference

## QR encoding

### `encodeQR(text: string, options?: QREncodeOptions): QRCodeResult`

```ts
interface QREncodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // default 'M'
  minVersion?: number; // default 1
  maxVersion?: number; // default 40
}

interface QRCodeResult {
  version: number;           // 1-40, the smallest version that fit
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  size: number;              // matrix width/height in modules (4*version + 17)
  modules: boolean[][];      // modules[y][x], true = dark
}
```

Throws if the text doesn't fit within `maxVersion` at the requested error-correction level.

## Barcode encoding

### `encodeCode128(text: string): Code128Result`

```ts
interface Code128Result {
  symbols: number[]; // Code128 symbol values incl. start/checksum/stop
  widths: number[];  // bar/space widths in modules, starts with a bar
}
```

Supports ASCII 0–127 (subsets A/B/C with automatic switching). Throws on empty input or
characters outside that range.

## Rendering

### `renderQRToSVG(text: string, options?: RenderOptions): string`

`RenderOptions` extends `QREncodeOptions` with `template?: QRTemplate | string`.

### `matrixToSVG(result: QRCodeResult, template?: QRTemplate | string): string`

Renders an already-encoded matrix (useful if you want to encode once and render multiple
styles without re-running the encoder).

### `QRTemplate`

```ts
interface QRTemplate {
  dotStyle?: 'square' | 'rounded' | 'dots' | 'classy';
  cornerStyle?: 'square' | 'rounded' | 'dot';
  foreground?: string;   // CSS color
  background?: string;   // CSS color
  gradient?: { type: 'linear' | 'radial'; colors: [string, string]; angle?: number };
  logo?: { href: string; sizeRatio?: number; backgroundInset?: boolean };
  margin?: number;       // quiet zone, in modules (default 4)
  moduleSize?: number;   // pixels per module (default 10)
}
```

### `listTemplates(): string[]`

Returns the built-in template names: `classic`, `rounded`, `dots`, `ocean`, `sunset`, `midnight`.

### `renderCode128ToSVG(text: string, options?: BarcodeRenderOptions): string`

```ts
interface BarcodeRenderOptions {
  moduleWidth?: number;  // px per narrow bar (default 2)
  height?: number;       // bar height in px (default 80)
  quietModules?: number; // quiet zone in modules (default 10)
  foreground?: string;
  background?: string;
  showText?: boolean;    // print human-readable text under the bars (default true)
  fontFamily?: string;
}
```

## i18n

### `getMessages(locale?: LocaleCode): MessageCatalog`

`LocaleCode`: `'en' | 'id' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh' | 'ar' | 'ru' | 'hi'`.
Falls back to `'en'` for unknown locales.

### `availableLocales(): LocaleCode[]`

## Scanning (browser only)

### `class LombokScanner`

```ts
LombokScanner.isSupported(): boolean  // true if window.BarcodeDetector exists

async start(videoEl: HTMLVideoElement, options?: ScannerOptions): Promise<void>
async scanOnce(): Promise<ScanResult[]>
watch(onResult: (results: ScanResult[]) => void, onError?: (err: unknown) => void): void
stop(): void
```

```ts
interface ScannerOptions {
  formats?: string[];              // default ['qr_code', 'code_128']
  facingMode?: 'environment' | 'user'; // default 'environment'
}

interface ScanResult {
  rawValue: string;
  format: string;
  cornerPoints?: Array<{ x: number; y: number }>;
}
```

`start()` throws a descriptive error if `BarcodeDetector` isn't available in the current
browser — see [ROADMAP.md](ROADMAP.md) for the planned pure-JS fallback.
