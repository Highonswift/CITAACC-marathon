import nodemailer, { type Transporter } from "nodemailer";

// SMTP is optional. When SMTP_HOST is unset, emails are logged to the server
// console so the flow stays observable without a mail provider.

const host = process.env.SMTP_HOST || "";
export const isEmailConfigured = !!host;

const FROM = process.env.SMTP_FROM || "CITAACC 5K <no-reply@citaacc.org>";

let transporter: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!host) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

interface MailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailInput): Promise<void> {
  const tx = getTransport();
  if (!tx) {
    console.log(`\n[email:console] To: ${to}\nSubject: ${subject}\n${stripHtml(html)}\n`);
    return;
  }
  try {
    await tx.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] send failed, falling back to console:", err);
    console.log(`\n[email:console] To: ${to}\nSubject: ${subject}\n${stripHtml(html)}\n`);
  }
}

// Used by the config-status endpoint to confirm SMTP credentials actually work.
export async function verifyEmailConnection(): Promise<{ ok: boolean; error?: string }> {
  const tx = getTransport();
  if (!tx) return { ok: false, error: "SMTP not configured" };
  try {
    await tx.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "verify failed" };
  }
}

// Diagnostic: actually attempt a send and return the REAL error (does not
// swallow it like sendMail does). Used by the admin test-email endpoint.
export async function sendTestEmail(
  to: string
): Promise<{ ok: boolean; from: string; error?: string; messageId?: string }> {
  const tx = getTransport();
  if (!tx) return { ok: false, from: FROM, error: "SMTP not configured (no SMTP_HOST)" };
  try {
    const info = await tx.sendMail({
      from: FROM,
      to,
      subject: "CITAACC 5K — test email",
      html: "<p>This is a test email from the CITAACC 5K portal. If you received it, email delivery is working.</p>",
    });
    return { ok: true, from: FROM, messageId: info.messageId };
  } catch (err) {
    return { ok: false, from: FROM, error: err instanceof Error ? err.message : String(err) };
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function registrationEmailHtml(opts: {
  regCode: string;
  fullName: string;
  participants: { fullName: string; bibNumber: string; token: string }[];
}): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const rows = opts.participants
    .map(
      (p) =>
        `<tr><td style="padding:8px 12px;border:1px solid #eee">${p.fullName}</td><td style="padding:8px 12px;border:1px solid #eee"><b>${p.bibNumber}</b></td><td style="padding:8px 12px;border:1px solid #eee"><a href="${base}/pass/${p.token}" style="color:#1539e1">View pass &rarr;</a></td></tr>`
    )
    .join("");
  return `
  <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:auto;color:#0f172a">
    <div style="background:linear-gradient(135deg,#1b4cf5,#141d57);border-radius:16px 16px 0 0;padding:24px;color:#fff">
      <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.8">CITAACC Chennai Chapter</div>
      <h2 style="margin:6px 0 0">Registration Confirmed 🎉</h2>
    </div>
    <div style="border:1px solid #eee;border-top:none;border-radius:0 0 16px 16px;padding:24px">
      <p>Hi ${opts.fullName}, your registration <b>${opts.regCode}</b> for the <b>5K Walk/Jog 2026</b> is confirmed.</p>
      <table style="border-collapse:collapse;width:100%;margin:12px 0">
        <thead><tr>
          <th style="padding:8px 12px;border:1px solid #eee;text-align:left;background:#f8fafc">Participant</th>
          <th style="padding:8px 12px;border:1px solid #eee;text-align:left;background:#f8fafc">Bib</th>
          <th style="padding:8px 12px;border:1px solid #eee;text-align:left;background:#f8fafc">Pass</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Each participant has an individual QR pass. Bring it to the venue on <b>09 August 2026</b> for check-in and T-shirt collection.</p>
      <p style="margin-top:16px">See you there!<br/><b>Team CITAACC Chennai</b></p>
    </div>
  </div>`;
}
