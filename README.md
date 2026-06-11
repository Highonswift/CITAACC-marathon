# CITAACC Chennai Chapter – 5K Walk/Jog 2026

Mobile-first registration & event-management portal for the CITAACC Chennai Chapter 5K Walk/Jog (09 August 2026).

Built as a single full-stack **Next.js 15 (App Router)** application with **Prisma + PostgreSQL**, **Razorpay** payments, and **QR-based** event-day operations.

## Features

- **Landing page** — hero, countdown, overview, benefits, activities, sponsors, FAQ, contact.
- **Registration** — single-page mobile flow: payer details, dynamic multi-participant cards (adults ₹500 / kids ₹200), safety & health, consent, **live fee calculation**, review, then payment.
- **Razorpay** — order creation + signature verification. Runs in **mock mode** automatically when keys are absent (so the full flow is testable locally).
- **QR event passes** — every participant gets a unique QR pass with bib number, deliverable by email and printable to PDF.
- **Volunteer portal** — mobile QR scanner for **attendance** and **T-shirt distribution** tracking.
- **Admin dashboard** — real-time registration / attendance / T-shirt / Chennai-zone analytics + CSV exports.

## Tech stack

| Layer    | Choice |
|----------|--------|
| Frontend | Next.js 15, React 19, Tailwind CSS v3 |
| Backend  | Next.js Route Handlers (Node.js) |
| Database | PostgreSQL via Prisma ORM |
| Payments | Razorpay |
| QR       | `qrcode` (generation), `html5-qrcode` (scanning) |

> The PRD lists NestJS + a separate backend; this implementation consolidates the API into Next.js Route Handlers for a single cohesive deployable. The data model and API surface map 1:1 to the PRD and can be lifted into a standalone service later if needed.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
#   - set DATABASE_URL to your local Postgres
#   - leave RAZORPAY_* blank to use mock payments for local testing

# 3. Create schema + demo data
npm run db:push
npm run db:seed

# 4. Run
npm run dev      # http://localhost:3000
```

## Routes

| Path | Purpose |
|------|---------|
| `/` | Public landing page |
| `/register` | Registration + payment |
| `/register/success` | Post-payment confirmation with passes |
| `/pass/[token]` | Individual participant event pass (QR) |
| `/volunteer` | Volunteer scanning portal (passcode) |
| `/admin` | Organizer dashboard (passcode) |

Default passcodes (change in `.env`): admin `citaacc-admin-2026`, volunteer `citaacc-volunteer-2026`.

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create registration + participants, returns Razorpay order |
| POST | `/api/payment/verify` | Verify payment, mark paid, email confirmation |
| GET | `/api/participant/[token]` | Look up participant by QR token |
| POST | `/api/attendance` | Mark attendance (volunteer) |
| POST | `/api/tshirt` | Mark T-shirt distributed (volunteer) |
| POST | `/api/auth/login` · `/logout` | Passcode sessions |
| GET | `/api/admin/stats` | Dashboard aggregates |
| GET | `/api/admin/registrations` | Registration list (search/filter) |
| GET | `/api/admin/export?type=` | CSV exports |

## Data model

`Registration` (1) ──< `Participant` (many). `Counter` provides atomic sequential `REG2026-NNN` codes and `CITAACC-NNNN` bib numbers. See `prisma/schema.prisma`.

## Production notes

- Set real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `NEXT_PUBLIC_RAZORPAY_KEY_ID` to enable live payments.
- Configure `SMTP_*` to send real confirmation emails (otherwise emails log to the server console).
- Deploy to Vercel/AWS with a managed PostgreSQL instance; run `prisma migrate deploy` in CI.
