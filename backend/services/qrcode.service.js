const QRCode = require('qrcode');

/** Generates a QR code as a base64 data URL for the given payload string/object. */
const generateQRDataURL = async (payload) => {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return QRCode.toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
};

/** Generates a QR code as a PNG Buffer (useful for embedding in PDFs). */
const generateQRBuffer = async (payload) => {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return QRCode.toBuffer(text, { errorCorrectionLevel: 'M', margin: 1, width: 300 });
};

module.exports = { generateQRDataURL, generateQRBuffer };
