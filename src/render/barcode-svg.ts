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
  const moduleWidth = options.moduleWidth ?? 2;
  const barHeight = options.height ?? 80;
  const quiet = options.quietModules ?? 10;
  const fg = options.foreground ?? '#000000';
  const bg = options.background ?? '#ffffff';
  const showText = options.showText ?? true;
  const font = options.fontFamily ?? 'monospace';

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

function escapeXML(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
