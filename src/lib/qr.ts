import QRCode from "qrcode";

export interface QrPayload {
  reg: string; // registration code
  pid: string; // participant id
  bib: string;
  name: string;
  cat: string;
  token: string;
}

// We encode the scan URL so any QR reader can open the verification page,
// while volunteers in the portal parse the token from it.
export function qrContentForToken(token: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${base}/pass/${token}`;
}

export async function qrDataUrl(token: string): Promise<string> {
  return QRCode.toDataURL(qrContentForToken(token), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
    color: { dark: "#141d57", light: "#ffffff" },
  });
}

// Extract a participant token from arbitrary scanned text (URL or raw token).
export function parseScannedToken(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const match = text.match(/\/pass\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  // Fall back to treating the whole string as a token.
  if (/^[A-Za-z0-9_-]{8,}$/.test(text)) return text;
  return null;
}
