# AI Build Market — Backend

Real backend: Next.js 15 + Postgres (Prisma) + Auth.js + Stripe Connect.

## The actual security model

Unauthenticated requests to `/api/listings` and `/` never receive `priceCents`
or `seller` in the response payload — the API route builds a different object
shape depending on whether `auth()` resolves a session. There is no client-side
hiding involved; a logged-out user inspecting network traffic in dev tools will
see the same stripped-down JSON the page renders from.

## Setup

1. **Database** — for production, create a free Postgres instance on Neon
   (neon.tech) or Vercel Postgres and put the connection string in `.env` as
   `DATABASE_URL`. For local dev, this repo was verified end-to-end against a
   local Docker Postgres:
   ```
   docker run -d --name aibuildmarket_postgres -e POSTGRES_PASSWORD=aibuildmarket -e POSTGRES_DB=aibuildmarket -p 5433:5432 postgres:16-alpine
   ```
   with `DATABASE_URL="postgresql://postgres:aibuildmarket@localhost:5433/aibuildmarket"`.

2. **Install & migrate:**
   ```
   npm install
   npx prisma migrate dev
   ```

3. **Auth secret:**
   ```
   openssl rand -base64 32
   ```
   Put the output in `.env` as `AUTH_SECRET`.

4. **Stripe:**
   - Get your secret key from the Stripe dashboard → `STRIPE_SECRET_KEY`
   - Enable Stripe Connect (Express) on the account
   - Add a webhook endpoint for `checkout.session.completed` and
     `checkout.session.expired` pointing at `/api/webhooks/stripe`, then put
     its signing secret in `.env` as `STRIPE_WEBHOOK_SECRET`
   - In production, checkout should route through **Paid!** instead of the
     bare Stripe calls in `app/api/checkout/route.ts`, to keep this
     consistent with the rest of the existing automation stack.

5. **Email (signup verification):** any SMTP relay works — a Gmail account
   with an App Password, or Resend's free SMTP relay. Set `SMTP_HOST`,
   `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` in `.env`. Without
   these, accounts can still log in and browse, but selling is blocked until
   email is verified (see below) and verification mail can't send until SMTP
   is configured.

6. **Run locally:**
   ```
   npm run dev
   ```

7. **Deploy:** push to the `KingGingerX` GitHub repo, connect the repo in
   Vercel, add the same environment variables in Vercel's project settings.

## What's real

- Password hashing (bcrypt), session-based auth (Auth.js/JWT)
- Server-side data-shape gating on listings/comments (verified live — see
  below)
- Signup + login rate limiting (in-memory, per-process — see
  `lib/rateLimit.ts` for the horizontal-scaling caveat)
- Email verification required before a seller can publish a listing
- Stripe Connect Express onboarding flow (`/sell/payouts`)
- Stripe webhook (`checkout.session.completed` / `.expired`) that marks
  orders complete and deactivates sold listings
- Checkout re-verifies the seller's `charges_enabled` status live against
  Stripe before creating a session, not just presence of a stored account id
- Full marketplace UI: browse/filter by category, search, listing detail with
  gated price/seller, comments, sell form, payouts status page — dark
  "molten" theme ported from the original static mockup
- Dynamic `sitemap.xml` (includes live listings) and `robots.txt` via Next's
  metadata route conventions; `llms.txt` served from `public/`

## Verified end-to-end (2026-07-12)

Ran a full migration + `next dev` against a real local Postgres container and
drove the app with live HTTP requests: signup, duplicate-email rejection,
password validation, signup rate-limit (429 on 6th attempt/hour), login,
session issuance, listing-creation blocked pre-verification (403), listing
creation after verification, gated vs. authenticated `/api/listings` payload
shapes, category filtering, search, comments, own-listing purchase block,
checkout blocked pre-Stripe-Connect, webhook signature rejection on a forged
payload, and browser-rendered visual QA of every page (home logged-out/in,
listing detail, sell form, payouts). All passed.

**Not tested live:** the actual Stripe Checkout redirect and webhook payment
completion — that needs real Stripe test-mode keys, which weren't available
in this environment. The checkout/webhook code path itself is real (not
mocked); it just hasn't been exercised against Stripe's servers yet.

## Still needs before production

- Real `DATABASE_URL` (Neon/Vercel Postgres), `STRIPE_SECRET_KEY` /
  `STRIPE_WEBHOOK_SECRET` (test mode first), and SMTP credentials in `.env`
- Vercel project permissions issue from the original setup (if still present)
- A second look at `lib/rateLimit.ts` if this ever runs on more than one
  server instance concurrently (swap the in-memory Map for Redis)
