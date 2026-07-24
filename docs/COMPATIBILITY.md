# Compatibility

## JavaScript Runtimes

LombokQRCode requires **ES2020** support. This includes:
- `async/await`
- Optional chaining (`?.`)
- Nullish coalescing (`??`)
- BigInt (not used, but assumed available)

| Runtime | Min Version | Notes |
|---------|-------------|-------|
| Node.js | 14+ | v14 (EOL 2023) still works; v18+ recommended |
| Chrome | 80+ | Shipping since Dec 2019 |
| Firefox | 74+ | Shipping since Mar 2020 |
| Safari | 13.1+ | Shipping since Mar 2020 |
| Edge | 80+ | Chromium-based; same as Chrome |
| iOS Safari | 13.4+ | Same as Safari version |
| Android Chrome | 80+ | Same as Chrome version |
| Samsung Internet | 12.0+ | Chromium-based; tracked with Chrome |

### Polyfills

If you need to support older browsers (IE11, old Safari), you'll need:
- A transpiler (Babel) to convert ES2020 → ES5
- Polyfills for `Promise`, `Array.isArray()`, `TextEncoder` (for UTF-8)

Example Babel config:
```json
{
  "presets": [["@babel/preset-env", { "targets": "> 1%, not dead" }]]
}
```

But this isn't officially tested or supported. Test thoroughly if you go this route.

## Cameras & Scanning

The camera scanning feature requires the **Barcode Detector API**, which is still in early stages of platform support:

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome (desktop) | ✅ Yes | v83+ (shipping since May 2020) |
| Chrome Android | ✅ Yes | v83+ |
| Edge | ✅ Yes | v83+ |
| Firefox | ❌ No | No public plan; use polyfill |
| Safari | ⚠️ Partial | iOS 15+; QR codes only, no other formats |
| Android System WebView | ✅ Yes | Available in WebView 83+ |

### Fallback for unsupported browsers

When `LombokScanner.isSupported()` returns `false`, your app should:
1. Hide the scan UI, or
2. Show a message "Camera scanning not available" with a link to enter manually, or
3. Use a polyfill like [jsQR](https://github.com/codewords/jsqr) or [wasm-zbar](https://github.com/underfin/wasm-zbar)

Example:
```ts
if (!LombokScanner.isSupported()) {
  console.warn('Camera scanning not available; offer manual entry');
  // ...
}
```

## TypeScript

LombokQRCode ships with full TypeScript 5.0+ support:
- `strict: true` mode
- No `any` types in the public API
- Declaration files (`.d.ts`) and source maps included

If you're using TypeScript < 4.5, some advanced type features may not work. Update to at least 4.5.

## Module Systems

| Module System | Support | How to use |
|---|---|---|
| CommonJS (Node.js) | ✅ | `require('lombokqrcode')` |
| ESM (modern) | ✅ | `import { ... } from 'lombokqrcode'` |
| UMD (browsers, legacy) | ❌ | Not built; use unpkg/jsdelivr instead |
| AMD | ❌ | Not built; use ES modules |

For UMD/AMD, use a bundler like webpack or esbuild to build your own UMD bundle, or load from unpkg/jsdelivr and use global variables (see examples).

## CSS & SVG Rendering

The SVG output is **plain SVG** — no special CSS or fonts needed. It works in:
- All modern browsers (Firefox, Chrome, Safari, Edge)
- Email clients that support embedded SVG (Gmail, Outlook modern)
- Print (when printed to PDF or paper)

⚠️  **Email note:** Some email clients strip or sandbox SVG. If you need to email a QR code, render to PNG instead (use an external SVG-to-PNG service, or `canvas` if available in the client environment).

## Known Issues

None documented yet. If you find a compatibility issue, please file it: https://github.com/codinglombok/LombokQRCode/issues
