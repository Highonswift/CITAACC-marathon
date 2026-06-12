# Environments: Development vs Production

This app uses **one codebase** with **two configurations**. Nothing in the code branches on
environment — only the values of environment variables differ. So "dev vs prod" = two sets of
env vars in two places.

| | **Development** | **Production** |
|---|---|---|
| Where config lives | local `.env` (gitignored, your machine) | **Vercel → Settings → Environment Variables** |
| Runs via | `npm run dev` on `localhost:3000` | Vercel, at `https://events.citaacc.com` |
| **Database** | **Neon #1** (`ep-fragrant-forest-...`) | **Neon #2** (production — separate DB) |
| **Razorpay** | `rzp_test_…` (test mode, no real money) | `rzp_live_…` (real payments) |
| **Webhook URL** | n/a (or ngrok tunnel) | `https://events.citaacc.com/api/payment/webhook` |
| **NEXT_PUBLIC_BASE_URL** | `http://localhost:3000` | `https://events.citaacc.com` |
| **Email** | blank → logs to console | Gmail/Resend SMTP |

> Golden rule: **production secrets never go in any file.** They live only in Vercel. The repo
> contains `.env.example` (placeholders) and your local `.env` is gitignored.

---

## Development (your machine)
Your local `.env` is already set for dev:
- `DATABASE_URL` → Neon #1 (dev data; safe to experiment, seed, reset)
- `RAZORPAY_*` → test keys
- `NEXT_PUBLIC_BASE_URL` → `http://localhost:3000`
- `SMTP_*` → blank (confirmation emails print to the terminal)

Run it:
```bash
npm run dev
```

Reset/seed the **dev** DB anytime (this only touches Neon #1):
```bash
npm run db:push     # sync schema
npm run db:seed     # demo data (wipes + reseeds)
```

---

## Production (Vercel) — set these env vars (Production scope)

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Neon #2 **pooled** URI (`...-pooler...?sslmode=require`) |
| `RAZORPAY_KEY_ID` | `rzp_live_…` |
| `RAZORPAY_KEY_SECRET` | live secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_…` (same id) |
| `RAZORPAY_WEBHOOK_SECRET` | `CITAACC_5K` (match the dashboard webhook) |
| `ADMIN_PASSCODE` | strong passcode |
| `VOLUNTEER_PASSCODE` | strong passcode |
| `NEXT_PUBLIC_BASE_URL` | `https://events.citaacc.com` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | Gmail app password (16 chars, no spaces) |
| `SMTP_FROM` | `CITAACC 5K <your-gmail@gmail.com>` |

After changing any of these, **redeploy** (env vars are read at build/start).

### One-time: create the production schema in Neon #2
Before the first real registration, push the schema to the new prod DB (using its **direct**,
non-pooled URI):
```bash
DATABASE_URL="<neon-2-direct-uri>" npx prisma db push
```
Do **not** run the seed against production.

---

## How to tell which environment is active
Open `/admin` on either site — the status chips show **Payments: Live/Mock** and
**Email: Connected/Console fallback** for that deployment. Dev (localhost) and prod
(events.citaacc.com) report independently.

---

## Migrating from "everything on Neon #1" to this split
Currently both local and Vercel may still point at Neon #1. To finish the split:
1. Create **Neon #2** (production project).
2. `DATABASE_URL="<neon-2-direct-uri>" npx prisma db push` to create its tables.
3. In **Vercel**, change `DATABASE_URL` to the Neon #2 **pooled** URI → redeploy.
4. Leave local `.env` on Neon #1 (it's now your dev DB).

Result: production data (real registrations) lives in Neon #2; you develop freely against Neon #1.
