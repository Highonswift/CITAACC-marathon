# Payments (Razorpay) & Email (SMTP) Setup

The app runs out-of-the-box in **mock payment** mode (no real charge) and logs emails to the
server console. This guide enables **real Razorpay payments** and **real email delivery**.

After configuring, check the status chips at the top of the **Admin dashboard** (`/admin`) — they
show whether payments are Live, the webhook is configured, and email is connected.

---

## 1. Razorpay payments

### 1.1 Get API keys
1. Sign in at <https://dashboard.razorpay.com>.
2. Toggle **Test Mode** (top bar) while testing.
3. Go to **Settings → API Keys → Generate Test Key**.
4. Copy the **Key Id** (`rzp_test_…`) and **Key Secret**.

### 1.2 Configure env
```env
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"   # same public key id as RAZORPAY_KEY_ID
```
Restart the dev server. The checkout now opens the real Razorpay modal (UPI / cards / netbanking / wallets).

> Setting **any** non-empty `RAZORPAY_KEY_SECRET` switches the app from mock to live mode.

### 1.3 Test cards / UPI (Test Mode)
- **Card:** `4111 1111 1111 1111`, any future expiry, any CVV.
- **UPI success:** `success@razorpay`  ·  **UPI failure:** `failure@razorpay`
- Full list: <https://razorpay.com/docs/payments/payments/test-card-details/>

### 1.4 Webhook (recommended for production)
The browser-side verify (`/api/payment/verify`) confirms payment immediately. The **webhook** is the
reliable backup — it marks a registration **PAID** even if the user closes the tab right after paying.

1. **Settings → Webhooks → Add New Webhook**.
2. **URL:** `https://<your-domain>/api/payment/webhook`
3. **Secret:** choose one, and set it as `RAZORPAY_WEBHOOK_SECRET` in your env.
4. **Active events:** `payment.captured` (and optionally `order.paid`, `payment.failed`).
5. Save.

```env
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
```

Both the verify route and the webhook funnel through one idempotent function
(`markRegistrationPaid`), so whichever fires first wins and the second is a safe no-op — a
registration is never double-confirmed and the confirmation email is sent exactly once.

### 1.5 Going live
Replace the test keys with **Live** keys (`rzp_live_…`) from the dashboard (Live Mode), update the
webhook URL to your production domain, and complete Razorpay KYC/activation.

---

## 2. Email (SMTP)

Set `SMTP_HOST` to enable real delivery. When unset, confirmation emails are printed to the server
console (handy for local development).

### Gmail
1. Enable 2-Step Verification on the Google account.
2. Create an **App Password**: <https://myaccount.google.com/apppasswords>.
3. Configure:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="the 16-char app password"
SMTP_FROM="CITAACC 5K <your@gmail.com>"
```

### SendGrid
```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="SG.xxxxxxxx"
SMTP_FROM="CITAACC 5K <verified-sender@yourdomain.com>"
```

- Port **587** → STARTTLS, port **465** → implicit TLS (handled automatically).
- The Admin dashboard runs a live `transporter.verify()` and shows **Email: Connected** when the
  credentials work, or **Console fallback** otherwise (hover the chip for the error detail).

---

## 3. What gets sent / charged

| Trigger | Effect |
|---------|--------|
| Submit registration | Creates a PENDING registration + Razorpay order |
| Pay (Razorpay) | `payment.captured` webhook **and** client verify → registration **PAID** |
| First PAID transition | Confirmation email with each participant's bib + QR pass link |
| Payment failed/cancelled | Registration marked **FAILED**; user can retry |

All amounts are computed **server-side** from the participant list (₹500 adult / ₹200 kid) — the
client total is never trusted.
