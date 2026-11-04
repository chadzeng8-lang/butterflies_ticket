import QRCode from "qrcode";

export async function toDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: { dark: "#1c1915", light: "#ffffff" },
  });
}
