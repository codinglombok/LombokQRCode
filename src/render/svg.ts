import { encodeQR, QREncodeOptions, QRCodeResult } from '../core/qr/encoder';

export type DotStyle = 'square' | 'rounded' | 'dots' | 'classy';
export type CornerStyle = 'square' | 'rounded' | 'dot';

export interface LogoOptions {
  /** Data URL or external href for the logo image. */
  href: string;
  /** Fraction of the QR's width the logo should occupy (0-0.35 recommended). */
  sizeRatio?: number;
  /** Adds a solid background behind the logo so surrounding modules stay legible. */
  backgroundInset?: boolean;
}

export interface QRTemplate {
  dotStyle?: DotStyle;
  cornerStyle?: CornerStyle;
  /** Solid color, or a CSS gradient spec handled via `gradient`. */
  foreground?: string;
  background?: string;
  /** Linear/radial gradient for the dark modules. */
  gradient?: { type: 'linear' | 'radial'; colors: [string, string]; angle?: number };
  logo?: LogoOptions;
  /** Quiet-zone width in modules (spec recommends >= 4). */
  margin?: number;
  /** Pixels per module in the output viewBox. */
  moduleSize?: number;
}

const BUILTIN_TEMPLATES: Record<string, QRTemplate> = {
  classic: { dotStyle: 'square', cornerStyle: 'square', foreground: '#000000', background: '#ffffff' },
  rounded: { dotStyle: 'rounded', cornerStyle: 'rounded', foreground: '#111827', background: '#ffffff' },
  dots: { dotStyle: 'dots', cornerStyle: 'dot', foreground: '#111827', background: '#ffffff' },
  ocean: {
    dotStyle: 'rounded',
    cornerStyle: 'rounded',
    background: '#ffffff',
    gradient: { type: 'linear', colors: ['#0ea5e9', '#4338ca'], angle: 45 },
  },
  sunset: {
    dotStyle: 'dots',
    cornerStyle: 'dot',
    background: '#fffaf0',
    gradient: { type: 'linear', colors: ['#f97316', '#db2777'], angle: 45 },
  },
  midnight: { dotStyle: 'classy', cornerStyle: 'rounded', foreground: '#f8fafc', background: '#0f172a' },
};

export function listTemplates(): string[] {
  return Object.keys(BUILTIN_TEMPLATES);
}

function resolveTemplate(t?: QRTemplate | string): QRTemplate {
  if (!t) return BUILTIN_TEMPLATES.classic;
  if (typeof t === 'string') {
    const found = BUILTIN_TEMPLATES[t];
    if (!found) throw new Error(`LombokQRCode: unknown template "${t}". Available: ${listTemplates().join(', ')}`);
    return found;
  }
  return { ...BUILTIN_TEMPLATES.classic, ...t };
}

function sanitizeColor(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const v = value.trim();
  const hex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
  const rgb = /^rgba?\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
  const hsl = /^hsla?\(\s*\d{1,3}(?:deg)?\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;
  return hex.test(v) || rgb.test(v) || hsl.test(v) ? v : fallback;
}

function sanitizeLogoHref(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  if (!v) return undefined;
  const lower = v.toLowerCase();

  const isSafeHttp = lower.startsWith('http://') || lower.startsWith('https://');
  const isSafeRootRelative = v.startsWith('/');
  const isSafeDataImage = lower.startsWith('data:image/');

  if (!isSafeHttp && !isSafeRootRelative && !isSafeDataImage) return undefined;

  return v
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isFinderZone(x: number, y: number, size: number): boolean {
  const inTL = x < 7 && y < 7;
  const inTR = x >= size - 7 && y < 7;
  const inBL = x < 7 && y >= size - 7;
  return inTL || inTR || inBL;
}

function dotPath(x: number, y: number, s: number, style: DotStyle): string {
  const cx = x + s / 2;
  const cy = y + s / 2;
  switch (style) {
    case 'dots':
      return `<circle cx="${cx}" cy="${cy}" r="${s / 2.2}" />`;
    case 'rounded':
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.3}" ry="${s * 0.3}" />`;
    case 'classy':
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${s * 0.15}" ry="${s * 0.15}" transform="rotate(45 ${cx} ${cy}) scale(0.9)" transform-origin="${cx} ${cy}" />`;
    case 'square':
    default:
      return `<rect x="${x}" y="${y}" width="${s}" height="${s}" />`;
  }
}

function finderPath(cx: number, cy: number, outer: number, style: CornerStyle, moduleSize: number): string {
  const half = (outer * moduleSize) / 2;
  const rOuter = style === 'square' ? 0 : half * 0.35;
  const innerSize = outer * moduleSize * (3 / 7);
  const innerHalf = innerSize / 2;
  const rInner = style === 'square' ? 0 : innerHalf * (style === 'dot' ? 1 : 0.4);
  const outerX = cx - half;
  const outerY = cy - half;
  const innerX = cx - innerHalf;
  const innerY = cy - innerHalf;
  return `
    <rect x="${outerX}" y="${outerY}" width="${half * 2}" height="${half * 2}" rx="${rOuter}" ry="${rOuter}" fill="none" stroke="currentColor" stroke-width="${moduleSize}" />
    <rect x="${innerX}" y="${innerY}" width="${innerHalf * 2}" height="${innerHalf * 2}" rx="${rInner}" ry="${rInner}" fill="currentColor" />
  `;
}

export interface RenderOptions extends QREncodeOptions {
  template?: QRTemplate | string;
}

/** Renders `text` as a fully self-contained SVG string. */
export function renderQRToSVG(text: string, options: RenderOptions = {}): string {
  const result = encodeQR(text, options);
  return matrixToSVG(result, options.template);
}

export function matrixToSVG(result: QRCodeResult, template?: QRTemplate | string): string {
  const t = resolveTemplate(template);
  const moduleSize = t.moduleSize ?? 10;
  const margin = t.margin ?? 4;
  const n = result.size;
  const totalModules = n + margin * 2;
  const px = totalModules * moduleSize;

  const safeBackground = sanitizeColor(t.background, '#ffffff');
  const safeForeground = sanitizeColor(t.foreground, '#000000');
  const gradientId = 'lombok-qr-gradient';
  let defs = '';
  let fillRef = safeForeground;
  if (t.gradient) {
    const { type, colors, angle = 0 } = t.gradient;
    const c0 = sanitizeColor(colors[0], safeForeground);
    const c1 = sanitizeColor(colors[1], safeForeground);
    if (type === 'linear') {
      const rad = (angle * Math.PI) / 180;
      const x2 = (Math.cos(rad) * 50 + 50).toFixed(1);
      const y2 = (Math.sin(rad) * 50 + 50).toFixed(1);
      const x1 = (100 - Number(x2)).toFixed(1);
      const y1 = (100 - Number(y2)).toFixed(1);
      defs = `<linearGradient id="${gradientId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${c0}" />
        <stop offset="100%" stop-color="${c1}" />
      </linearGradient>`;
    } else {
      defs = `<radialGradient id="${gradientId}">
        <stop offset="0%" stop-color="${c0}" />
        <stop offset="100%" stop-color="${c1}" />
      </radialGradient>`;
    }
    fillRef = `url(#${gradientId})`;
  }

  const dots: string[] = [];
  const finders: string[] = [];
  const dotStyle = t.dotStyle ?? 'square';
  const cornerStyle = t.cornerStyle ?? 'square';

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!result.modules[y][x]) continue;
      if (isFinderZone(x, y, n)) continue; // finder zones drawn separately for a clean corner style
      const px_ = (x + margin) * moduleSize;
      const py_ = (y + margin) * moduleSize;
      dots.push(dotPath(px_, py_, moduleSize, dotStyle));
    }
  }

  const finderCenters: Array<[number, number]> = [
    [3, 3],
    [n - 4, 3],
    [3, n - 4],
  ];
  for (const [gx, gy] of finderCenters) {
    const cx = (gx + margin) * moduleSize + moduleSize / 2;
    const cy = (gy + margin) * moduleSize + moduleSize / 2;
    finders.push(finderPath(cx, cy, 7, cornerStyle, moduleSize));
  }

  let logoMarkup = '';
  if (t.logo) {
    const ratio = Math.min(Math.max(t.logo.sizeRatio ?? 0.2, 0.1), 0.35);
    const logoSize = px * ratio;
    const logoX = (px - logoSize) / 2;
    const logoY = (px - logoSize) / 2;
    const bg = t.logo.backgroundInset
      ? `<rect x="${logoX - moduleSize}" y="${logoY - moduleSize}" width="${logoSize + moduleSize * 2}" height="${logoSize + moduleSize * 2}" rx="${moduleSize}" fill="${t.background ?? '#ffffff'}" />`
      : '';
    const safeLogoHref = sanitizeLogoHref(t.logo.href);
    logoMarkup = safeLogoHref
      ? `${bg}<image href="${safeLogoHref}" x="${logoX}" y="${logoY}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet" />`
      : '';
  }

  const safeFillRefAttr = fillRef
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" role="img" aria-label="QR code">
  ${defs ? `<defs>${defs}</defs>` : ''}
  <rect width="${px}" height="${px}" fill="${safeBackground}" />
  <g fill="${safeFillRefAttr}">${dots.join('')}</g>
  <g style="color:${safeFillRefAttr}">${finders.join('')}</g>
  ${logoMarkup}
</svg>`;
}
