export type LocaleCode = 'en' | 'id' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh' | 'ar' | 'ru' | 'hi';

export interface MessageCatalog {
  errorTooLong: string;
  errorUnsupportedChar: string;
  errorEmptyInput: string;
  scanPromptCamera: string;
  scanPromptNoCamera: string;
  scanPromptDenied: string;
  labelCopy: string;
  labelDownload: string;
  labelScanQR: string;
  labelScanBarcode: string;
}

const en: MessageCatalog = {
  errorTooLong: 'The provided text is too long to encode at this error-correction level.',
  errorUnsupportedChar: 'This character set is not supported by the selected mode.',
  errorEmptyInput: 'Please provide some text or data to encode.',
  scanPromptCamera: 'Point your camera at a code to scan it.',
  scanPromptNoCamera: 'No camera was found on this device.',
  scanPromptDenied: 'Camera access was denied. Please allow camera permissions to scan.',
  labelCopy: 'Copy',
  labelDownload: 'Download',
  labelScanQR: 'Scan QR Code',
  labelScanBarcode: 'Scan Barcode',
};

const id: MessageCatalog = {
  errorTooLong: 'Teks yang diberikan terlalu panjang untuk level koreksi kesalahan ini.',
  errorUnsupportedChar: 'Set karakter ini tidak didukung oleh mode yang dipilih.',
  errorEmptyInput: 'Silakan masukkan teks atau data untuk dikodekan.',
  scanPromptCamera: 'Arahkan kamera Anda ke kode untuk memindainya.',
  scanPromptNoCamera: 'Tidak ada kamera yang ditemukan di perangkat ini.',
  scanPromptDenied: 'Akses kamera ditolak. Mohon izinkan akses kamera untuk memindai.',
  labelCopy: 'Salin',
  labelDownload: 'Unduh',
  labelScanQR: 'Pindai Kode QR',
  labelScanBarcode: 'Pindai Barcode',
};

const es: MessageCatalog = {
  errorTooLong: 'El texto proporcionado es demasiado largo para este nivel de corrección de errores.',
  errorUnsupportedChar: 'Este conjunto de caracteres no es compatible con el modo seleccionado.',
  errorEmptyInput: 'Proporcione texto o datos para codificar.',
  scanPromptCamera: 'Apunte su cámara a un código para escanearlo.',
  scanPromptNoCamera: 'No se encontró ninguna cámara en este dispositivo.',
  scanPromptDenied: 'Se denegó el acceso a la cámara. Permita el acceso para escanear.',
  labelCopy: 'Copiar',
  labelDownload: 'Descargar',
  labelScanQR: 'Escanear Código QR',
  labelScanBarcode: 'Escanear Código de Barras',
};

const fr: MessageCatalog = {
  errorTooLong: "Le texte fourni est trop long pour ce niveau de correction d'erreur.",
  errorUnsupportedChar: "Ce jeu de caractères n'est pas pris en charge par le mode sélectionné.",
  errorEmptyInput: 'Veuillez fournir du texte ou des données à encoder.',
  scanPromptCamera: 'Pointez votre caméra vers un code pour le scanner.',
  scanPromptNoCamera: "Aucune caméra n'a été trouvée sur cet appareil.",
  scanPromptDenied: "L'accès à la caméra a été refusé. Veuillez l'autoriser pour scanner.",
  labelCopy: 'Copier',
  labelDownload: 'Télécharger',
  labelScanQR: 'Scanner le code QR',
  labelScanBarcode: 'Scanner le code-barres',
};

const de: MessageCatalog = {
  errorTooLong: 'Der angegebene Text ist für diese Fehlerkorrekturstufe zu lang.',
  errorUnsupportedChar: 'Dieser Zeichensatz wird vom ausgewählten Modus nicht unterstützt.',
  errorEmptyInput: 'Bitte geben Sie Text oder Daten zum Codieren an.',
  scanPromptCamera: 'Richten Sie Ihre Kamera auf einen Code, um ihn zu scannen.',
  scanPromptNoCamera: 'Auf diesem Gerät wurde keine Kamera gefunden.',
  scanPromptDenied: 'Kamerazugriff verweigert. Bitte erlauben Sie den Zugriff zum Scannen.',
  labelCopy: 'Kopieren',
  labelDownload: 'Herunterladen',
  labelScanQR: 'QR-Code scannen',
  labelScanBarcode: 'Barcode scannen',
};

const pt: MessageCatalog = {
  errorTooLong: 'O texto fornecido é muito longo para este nível de correção de erros.',
  errorUnsupportedChar: 'Este conjunto de caracteres não é suportado pelo modo selecionado.',
  errorEmptyInput: 'Forneça texto ou dados para codificar.',
  scanPromptCamera: 'Aponte sua câmera para um código para escaneá-lo.',
  scanPromptNoCamera: 'Nenhuma câmera foi encontrada neste dispositivo.',
  scanPromptDenied: 'Acesso à câmera negado. Permita o acesso para escanear.',
  labelCopy: 'Copiar',
  labelDownload: 'Baixar',
  labelScanQR: 'Escanear Código QR',
  labelScanBarcode: 'Escanear Código de Barras',
};

const ja: MessageCatalog = {
  errorTooLong: '指定されたテキストは、この誤り訂正レベルではエンコードするには長すぎます。',
  errorUnsupportedChar: 'この文字セットは選択されたモードでサポートされていません。',
  errorEmptyInput: 'エンコードするテキストまたはデータを入力してください。',
  scanPromptCamera: 'カメラをコードに向けてスキャンしてください。',
  scanPromptNoCamera: 'このデバイスにはカメラが見つかりませんでした。',
  scanPromptDenied: 'カメラへのアクセスが拒否されました。スキャンするには許可してください。',
  labelCopy: 'コピー',
  labelDownload: 'ダウンロード',
  labelScanQR: 'QRコードをスキャン',
  labelScanBarcode: 'バーコードをスキャン',
};

const zh: MessageCatalog = {
  errorTooLong: '提供的文本在此纠错级别下过长，无法编码。',
  errorUnsupportedChar: '所选模式不支持此字符集。',
  errorEmptyInput: '请提供要编码的文本或数据。',
  scanPromptCamera: '将摄像头对准代码进行扫描。',
  scanPromptNoCamera: '未在此设备上找到摄像头。',
  scanPromptDenied: '摄像头访问被拒绝。请允许摄像头权限以进行扫描。',
  labelCopy: '复制',
  labelDownload: '下载',
  labelScanQR: '扫描二维码',
  labelScanBarcode: '扫描条形码',
};

const ar: MessageCatalog = {
  errorTooLong: 'النص المقدم طويل جدًا للترميز بمستوى تصحيح الخطأ هذا.',
  errorUnsupportedChar: 'مجموعة الأحرف هذه غير مدعومة في الوضع المحدد.',
  errorEmptyInput: 'يرجى تقديم نص أو بيانات للترميز.',
  scanPromptCamera: 'وجّه الكاميرا نحو الرمز لمسحه ضوئيًا.',
  scanPromptNoCamera: 'لم يتم العثور على كاميرا على هذا الجهاز.',
  scanPromptDenied: 'تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول للمسح الضوئي.',
  labelCopy: 'نسخ',
  labelDownload: 'تنزيل',
  labelScanQR: 'مسح رمز QR',
  labelScanBarcode: 'مسح الباركود',
};

const ru: MessageCatalog = {
  errorTooLong: 'Указанный текст слишком длинный для этого уровня коррекции ошибок.',
  errorUnsupportedChar: 'Этот набор символов не поддерживается выбранным режимом.',
  errorEmptyInput: 'Пожалуйста, укажите текст или данные для кодирования.',
  scanPromptCamera: 'Наведите камеру на код, чтобы отсканировать его.',
  scanPromptNoCamera: 'Камера на этом устройстве не найдена.',
  scanPromptDenied: 'Доступ к камере запрещён. Разрешите доступ для сканирования.',
  labelCopy: 'Копировать',
  labelDownload: 'Скачать',
  labelScanQR: 'Сканировать QR-код',
  labelScanBarcode: 'Сканировать штрихкод',
};

const hi: MessageCatalog = {
  errorTooLong: 'दिया गया टेक्स्ट इस त्रुटि-सुधार स्तर पर एन्कोड करने के लिए बहुत लंबा है।',
  errorUnsupportedChar: 'यह वर्ण सेट चयनित मोड द्वारा समर्थित नहीं है।',
  errorEmptyInput: 'कृपया एन्कोड करने के लिए टेक्स्ट या डेटा प्रदान करें।',
  scanPromptCamera: 'स्कैन करने के लिए अपने कैमरे को कोड की ओर इंगित करें।',
  scanPromptNoCamera: 'इस डिवाइस पर कोई कैमरा नहीं मिला।',
  scanPromptDenied: 'कैमरा एक्सेस अस्वीकृत। स्कैन करने के लिए कृपया अनुमति दें।',
  labelCopy: 'कॉपी करें',
  labelDownload: 'डाउनलोड करें',
  labelScanQR: 'क्यूआर कोड स्कैन करें',
  labelScanBarcode: 'बारकोड स्कैन करें',
};

const catalogs: Record<LocaleCode, MessageCatalog> = { en, id, es, fr, de, pt, ja, zh, ar, ru, hi };

export function getMessages(locale: LocaleCode = 'en'): MessageCatalog {
  return catalogs[locale] ?? catalogs.en;
}

export function availableLocales(): LocaleCode[] {
  return Object.keys(catalogs) as LocaleCode[];
}
