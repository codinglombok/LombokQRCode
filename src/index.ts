// Core QR encoding
export { encodeQR } from './core/qr/encoder';
export type { QREncodeOptions, QRCodeResult } from './core/qr/encoder';
export type { ErrorCorrectionLevel } from './core/qr/tables';

// Core barcode encoding
export { encodeCode128 } from './core/barcode/code128';
export type { Code128Result } from './core/barcode/code128';

// Rendering
export { renderQRToSVG, matrixToSVG, listTemplates } from './render/svg';
export type { QRTemplate, DotStyle, CornerStyle, LogoOptions, RenderOptions } from './render/svg';
export { renderCode128ToSVG } from './render/barcode-svg';
export type { BarcodeRenderOptions } from './render/barcode-svg';

// i18n
export { getMessages, availableLocales } from './i18n';
export type { LocaleCode, MessageCatalog } from './i18n';

// Capture / scanning (browser only)
export { LombokScanner } from './capture/camera';
export type { ScanResult, ScannerOptions } from './capture/camera';
