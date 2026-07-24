import React, { useState, useEffect } from 'react';
import { renderQRToSVG, renderCode128ToSVG, listTemplates } from 'lombokqrcode';

export default function App() {
  const [text, setText] = useState('https://github.com/codinglombok/LombokQRCode');
  const [template, setTemplate] = useState('classic');
  const [qrSvg, setQrSvg] = useState('');
  const [barcodeSvg, setBarcodeSvg] = useState('');
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    setTemplates(listTemplates());
  }, []);

  useEffect(() => {
    if (!text) return;
    try {
      const svg = renderQRToSVG(text, { template });
      setQrSvg(svg);
    } catch (e) {
      setQrSvg(`<p style="color:red;">Error: ${e.message}</p>`);
    }

    try {
      const svg = renderCode128ToSVG(text.slice(0, 20), { showText: true });
      setBarcodeSvg(svg);
    } catch (e) {
      setBarcodeSvg(`<p style="color:red;">Error: ${e.message}</p>`);
    }
  }, [text, template]);

  const downloadSvg = (svg, filename) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>LombokQRCode — React Example</h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text for QR code"
          style={{
            flex: 1,
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1rem',
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Template: </label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
        >
          {templates.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2rem',
          marginTop: '2rem',
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3>QR Code</h3>
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <button
            onClick={() => downloadSvg(qrSvg, 'qrcode.svg')}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Download SVG
          </button>
        </div>

        <div
          style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <h3>Code128 Barcode</h3>
          <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} />
          <button
            onClick={() => downloadSvg(barcodeSvg, 'barcode.svg')}
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Download SVG
          </button>
        </div>
      </div>
    </div>
  );
}
