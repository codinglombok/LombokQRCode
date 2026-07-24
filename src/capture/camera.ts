/**
 * Browser-only camera capture and scanning helper.
 *
 * Scope note: this module wires up camera access and, where the browser
 * exposes the native `BarcodeDetector` API (Chrome/Edge/Android WebView,
 * and Safari 17+ for some symbologies), uses it to decode QR/barcodes
 * from live video. A fully from-scratch camera decoder (finder-pattern
 * detection, perspective correction, bit sampling) is tracked as a
 * roadmap item — see docs/ARCHITECTURE.md — rather than shipped
 * half-verified. Where `BarcodeDetector` is unavailable, `scan()`
 * rejects with a clear, catchable error so callers can show a message
 * or offer manual entry instead of failing silently.
 */

export interface ScanResult {
  rawValue: string;
  format: string;
  cornerPoints?: Array<{ x: number; y: number }>;
}

export interface ScannerOptions {
  formats?: string[]; // e.g. ['qr_code', 'code_128']
  facingMode?: 'environment' | 'user';
}

export class LombokScanner {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private detector: any = null;
  private rafHandle: number | null = null;

  static isSupported(): boolean {
    return typeof window !== 'undefined' && 'BarcodeDetector' in window;
  }

  async start(videoEl: HTMLVideoElement, options: ScannerOptions = {}): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      throw new Error('LombokQRCode: camera access requires a browser environment with mediaDevices support.');
    }
    if (!LombokScanner.isSupported()) {
      throw new Error(
        'LombokQRCode: this browser does not expose the native BarcodeDetector API. ' +
          'A pure-JS fallback decoder is on the roadmap; for now, consider a polyfill ' +
          'or manual code entry as a fallback path.'
      );
    }

    const DetectorCtor = (window as any).BarcodeDetector;
    this.detector = new DetectorCtor({ formats: options.formats ?? ['qr_code', 'code_128'] });

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: options.facingMode ?? 'environment' },
      audio: false,
    });
    videoEl.srcObject = this.stream;
    await videoEl.play();
    this.video = videoEl;
  }

  /** Scans the current video frame once. Call repeatedly (e.g. via requestAnimationFrame) for continuous scanning. */
  async scanOnce(): Promise<ScanResult[]> {
    if (!this.video || !this.detector) {
      throw new Error('LombokQRCode: call start() before scanOnce().');
    }
    const results = await this.detector.detect(this.video);
    return results.map((r: any) => ({
      rawValue: r.rawValue,
      format: r.format,
      cornerPoints: r.cornerPoints,
    }));
  }

  /** Continuously scans until a result is found or stop() is called. */
  watch(onResult: (results: ScanResult[]) => void, onError?: (err: unknown) => void): void {
    const loop = async () => {
      try {
        const results = await this.scanOnce();
        if (results.length > 0) onResult(results);
      } catch (err) {
        onError?.(err);
      }
      this.rafHandle = requestAnimationFrame(loop);
    };
    this.rafHandle = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafHandle !== null) cancelAnimationFrame(this.rafHandle);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video = null;
    this.detector = null;
  }
}
