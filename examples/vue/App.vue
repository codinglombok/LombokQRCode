<template>
  <div style="max-width: 800px; margin: 0 auto; padding: 2rem">
    <h1>LombokQRCode — Vue 3 Example</h1>

    <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem">
      <input
        v-model="text"
        type="text"
        placeholder="Enter text for QR code"
        style="flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem"
      />
    </div>

    <div style="margin-bottom: 1rem">
      <label>Template: </label>
      <select
        v-model="template"
        style="padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd"
      >
        <option v-for="t in templates" :key="t" :value="t">
          {{ t }}
        </option>
      </select>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem">
      <div
        style="
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        "
      >
        <h3>QR Code</h3>
        <div v-html="qrSvg"></div>
        <button
          @click="downloadSvg(qrSvg, 'qrcode.svg')"
          style="
            margin-top: 0.5rem;
            padding: 0.5rem 1rem;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Download SVG
        </button>
      </div>

      <div
        style="
          background: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        "
      >
        <h3>Code128 Barcode</h3>
        <div v-html="barcodeSvg"></div>
        <button
          @click="downloadSvg(barcodeSvg, 'barcode.svg')"
          style="
            margin-top: 0.5rem;
            padding: 0.5rem 1rem;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          "
        >
          Download SVG
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { renderQRToSVG, renderCode128ToSVG, listTemplates } from 'lombokqrcode';

const text = ref('https://github.com/codinglombok/LombokQRCode');
const template = ref('classic');
const qrSvg = ref('');
const barcodeSvg = ref('');
const templates = ref([]);

onMounted(() => {
  templates.value = listTemplates();
});

watch([text, template], () => {
  if (!text.value) return;

  try {
    qrSvg.value = renderQRToSVG(text.value, { template: template.value });
  } catch (e) {
    qrSvg.value = `<p style="color:red;">Error: ${e.message}</p>`;
  }

  try {
    barcodeSvg.value = renderCode128ToSVG(text.value.slice(0, 20), { showText: true });
  } catch (e) {
    barcodeSvg.value = `<p style="color:red;">Error: ${e.message}</p>`;
  }
});

const downloadSvg = (svg, filename) => {
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
</script>
