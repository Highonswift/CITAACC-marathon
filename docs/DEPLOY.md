# Deploying to Vercel + Neon

This app is a single Next.js application — front end, API routes, and DB access all deploy
together as one Vercel project. The database is your hosted Neon PostgreSQL.

Estimated time: ~15 minutes.

---

## Prerequisites (already done)
- ✅ Code pushed to GitHub: `Highonswift/CITAACC-marathon`
- ✅ Neon database created and schema pushed (`prisma db push`)
- ✅ Razorpay test keys in hand

---

## Step 1 — Import the repo into Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New… → Project** → import **`Highonswift/CITAACC-marathon`**.
3. Vercel auto-detects **Next.js**. Leave Build/Output settings at their defaults:
   - Build Command: `next build` (our `package.json` runs `prisma generate` automatically via `postinstall` and the `build` script).
   - Install Command: `npm install`
4. **Before clicking Deploy**, add the environment variables (Step 2).

---

## Step 2 — Environment variables
In the Vercel import screen (or later under **Project → Settings → Environment Variables**),
add the following for the **Production** environment:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Neon **pooled** URI (`...-pooler...?sslmode=require`) | Use the connection-pooling string for runtime |
| `RAZORPAY_KEY_ID` | `rzp_test_...` (then `rzp_live_...` later) | Server-side |
| `RAZORPAY_KEY_SECRET` | your secret | **Server-side only — never NEXT_PUBLIC** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same as `RAZORPAY_KEY_ID` | Used by the browser checkout |
| `RAZORPAY_WEBHOOK_SECRET` | your webhook secret | For `/api/payment/webhook` |
| `ADMIN_PASSCODE` | a strong passcode | Admin dashboard login |
| `VOLUNTEER_PASSCODE` | a strong passcode | Volunteer portal login |
| `NEXT_PUBLIC_BASE_URL` | `https://<your-vercel-domain>` | **Critical** — encoded into QR passes (see Step 4) |
| `SMTP_HOST` | e.g. `smtp.gmail.com` | Optional — omit to log emails to server logs |
| `SMTP_PORT` | `587` | Optional |
| `SMTP_USER` | your SMTP user | Optional |
| `SMTP_PASS` | app password / API key | Optional |
| `SMTP_FROM` | `CITAACC 5K <you@domain>` | Optional |

> You won't know the exact `NEXT_PUBLIC_BASE_URL` until after the first deploy. Put a placeholder
> (or your custom domain) now, then fix it in Step 4.

---

## Step 3 — Deploy
Click **Deploy**. Vercel installs deps, runs `prisma generate` + `next build`, and publishes.
You'll get a URL like `https://citaacc-marathon.vercel.app`.

The Neon tables already exist (you ran `prisma db push`), so the app is immediately functional.

---

## Step 4 — Fix the public base URL (important for QR passes)
Each participant's QR code encodes `${NEXT_PUBLIC_BASE_URL}/pass/<token>`. If the base URL is wrong,
scanned QR codes point to the wrong place.

1. Copy your live Vercel URL (or set up a custom domain under **Settings → Domains**).
2. Set `NEXT_PUBLIC_BASE_URL` to that exact `https://...` value.
3. **Redeploy** (Deployments → ⋯ → Redeploy) so the new value is baked in.

---

## Step 5 — Point the Razorpay webhook at production
1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**.
2. URL: `https://<your-domain>/api/payment/webhook`
3. Secret: the same value as `RAZORPAY_WEBHOOK_SECRET`.
4. Active events: `payment.captured` (and optionally `payment.failed`). Save.

---

## Step 6 — Smoke test production
1. Open the site → **Register** → complete a **test** payment (`success@razorpay` UPI).
2. Confirm the success page shows QR passes, and a confirmation email arrives (if SMTP set).
3. Open `/admin` (admin passcode) → the registration shows **PAID**; the status chips read
   **Payments: Live** and (if webhook set) **Webhook: Configured**.
4. Open `/volunteer` (volunteer passcode) → scan/lookup the pass → mark attendance & T-shirt.

---

## Going live with real money
1. Complete Razorpay **KYC/activation**.
2. Swap the three Razorpay keys for **Live** keys (`rzp_live_...`) in Vercel env vars.
3. Update the webhook to the live mode + production URL.
4. Redeploy.

---

## Schema changes after launch
If you change `prisma/schema.prisma` later, apply it to Neon before/with the deploy:
```bash
DATABASE_URL="<neon-direct-uri>" npx prisma db push
```
(Use the **direct**, non-pooled URI for schema changes; the pooled one is for app runtime.)

---

## Notes
- **Free tiers are plenty** for 300+ participants (Neon free ≈ 0.5 GB; this data is < 1 MB).
- Neon free databases **scale to zero** when idle — the first request after a pause may take an
  extra second to wake. Harmless for this use case.
- Secrets live **only** in Vercel env vars. The repo never contains them (`.env` is gitignored).
