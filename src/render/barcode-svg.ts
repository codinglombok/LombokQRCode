import { encodeCode128 } from '../core/barcode/code128';

export interface BarcodeRenderOptions {
  moduleWidth?: number;
  height?: number;
  quietModules?: number;
  foreground?: string;
  background?: string;
  /** Print the human-readable text under the bars. */
  showText?: boolean;
  fontFamily?: string;
}

export function renderCode128ToSVG(text: string, options: BarcodeRenderOptions = {}): string {
  const { widths } = encodeCode128(text);
  const moduleWidth = toSafeNumber(options.moduleWidth, 2, { min: 0.1 });
  const barHeight = toSafeNumber(options.height, 80, { min: 1 });
  const quiet = Math.floor(toSafeNumber(options.quietModules, 10, { min: 0 }));
  const fg = sanitizeColor(options.foreground, '#000000');
  const bg = sanitizeColor(options.background, '#ffffff');
  const showText = options.showText ?? true;
  const font = escapeXMLAttr(sanitizeFontFamily(options.fontFamily, 'monospace'));

  const totalModules = widths.reduce((a, b) => a + b, 0) + quiet * 2;
  const width = totalModules * moduleWidth;
  const textHeight = showText ? 20 : 0;
  const height = barHeight + textHeight;

  let x = quiet * moduleWidth;
  let isBar = true;
  const bars: string[] = [];
  for (const w of widths) {
    const barWidth = w * moduleWidth;
    if (isBar) {
      bars.push(`<rect x="${x}" y="0" width="${barWidth}" height="${barHeight}" />`);
    }
    x += barWidth;
    isBar = !isBar;
  }

  const label = showText
    ? `<text x="${width / 2}" y="${barHeight + 15}" text-anchor="middle" font-family="${font}" font-size="14" fill="${fg}">${escapeXML(text)}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Barcode">
  <rect width="${width}" height="${height}" fill="${bg}" />
  <g fill="${fg}">${bars.join('')}</g>
  ${label}
</svg>`;
}

function toSafeNumber(
  value: unknown,
  fallback: number,
  bounds: { min?: number; max?: number } = {}
): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (bounds.min !== undefined && n < bounds.min) return bounds.min;
  if (bounds.max !== undefined && n > bounds.max) return bounds.max;
  return n;
}

function sanitizeColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : fallback;
}

function sanitizeFontFamily(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  return /^[a-zA-Z0-9 ,"'_-]+$/.test(v) ? v : fallback;
}

function escapeXMLAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
