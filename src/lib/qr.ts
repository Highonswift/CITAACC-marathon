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
  // 1. A pass URL → extract the token.
  const match = text.match(/\/pass\/([A-Za-z0-9_-]+)/);
  if (match) return match[1];
  // 2. A bib number, in any form a volunteer might type:
  //    "CITAACC-0023", "citaacc 23", or a bare "23" → normalize to "CITAACC-0023".
  const bib = text.match(/^citaacc[-\s]?0*(\d{1,5})$/i);
  if (bib) return `CITAACC-${bib[1].padStart(4, "0")}`;
  if (/^\d{1,5}$/.test(text)) return `CITAACC-${text.padStart(4, "0")}`;
  // 3. Otherwise treat the whole string as a raw QR token.
  if (/^[A-Za-z0-9_-]{8,}$/.test(text)) return text;
  return null;
}
