import QRCode from 'qrcode';

export function buildShareSlug(handle: string): string {
  const cleaned = handle
    .replace(/^@+/, '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '');
  return cleaned || 'prettyychaos_';
}

export function buildShareUrl(handle: string): string {
  return `https://whisperlink.app/${buildShareSlug(handle)}`;
}

export function buildQrDownloadFilename(handle: string): string {
  return `lurk-${buildShareSlug(handle)}-qr.png`;
}

export const QR_PREVIEW_OPTIONS: QRCode.QRCodeRenderersOptions = {
  width: 148,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#191116',
    light: '#FFFFFF',
  },
};

export const QR_EXPORT_OPTIONS: QRCode.QRCodeToDataURLOptions = {
  width: 512,
  margin: 2,
  errorCorrectionLevel: 'M',
  color: {
    dark: '#191116',
    light: '#FFFFFF',
  },
};

export async function generateShareQrDataUrl(handle: string): Promise<string> {
  return QRCode.toDataURL(buildShareUrl(handle), QR_EXPORT_OPTIONS);
}
