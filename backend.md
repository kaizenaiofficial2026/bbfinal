# Beyond Borders — Backend Implementation Handoff (`backend.md`)

> **Purpose:** A full-detail, code-prompt-style handoff for implementing the backend of the
> `beyond-borders-next` site. Hand any section to an engineer (or coding agent) and it should
> be buildable without further context. Production-ready is the bar — no stubs, no mocks left
> in shippable paths. Read top-to-bottom; build in the phase order at the end.

---

## 0. Context & current state

`beyond-borders-next` is a **fully static** Next.js 16 (App Router) + React 19 + TypeScript
marketing site for a Sri Lanka travel agency. Today there is **no backend**: no database, API
routes, auth, email, env vars, or CMS.

| Area | Current state | File |
|------|---------------|------|
| Content (14 destinations, 4 tour packages) | Hardcoded TS arrays | [lib/travel.ts](lib/travel.ts) |
| Contact form | Server-action **stub** — returns a thank-you string, discards input | [app/actions.ts](app/actions.ts) |
| Booking form | Client-only, **mock** card fields, nothing submitted/charged | [components/BookingRequestForm.tsx](components/BookingRequestForm.tsx) |
| Destination / booking detail pages | `generateStaticParams` + `dynamicParams = false` | [app/[slug]/page.tsx](app/[slug]/page.tsx), [app/booking/[slug]/page.tsx](app/booking/[slug]/page.tsx) |

**Goal:** make it production-ready by adding (1) a Supabase-backed data layer so content is
DB-driven, (2) a staff admin dashboard to manage packages / destinations / enquiries /
bookings, (3) real enquiry + booking submission with email, and (4) real payments via Seylan
Bank's gateway. Strong automated testing and a React code-health gate throughout.

### Confirmed decisions
- **Database:** Supabase (Postgres + Auth + Storage).
- **Email:** Resend + React Email (`resend`, `react-email`, `@react-email/components`).
- **Payment:** Seylan Bank = **Mastercard Payment Gateway Services (MPGS), API v100**,
  **Hosted Checkout** via **full-page redirect** (PCI SAQ-A; no card data touches our servers).
  Credentials still pending → build against the MTF/test base URL and gate live calls behind a
  flag (`PAYMENTS_ENABLED`).
- **Payment flow:** **Deferred pay-link** — save booking → planner confirms total in dashboard
  → system emails a secure, single-use, expiring pay link → customer pays on the hosted page →
  webhook marks `PAID`.
- **Auth:** **Staff/admin only.** Customers never log in.
- **Checkout UI:** redirect to MPGS hosted page.
- **"React Doctor" gate:** React Compiler + `eslint-plugin-react-hooks` + `react-scan` render
  profiling + a React best-practices review pass on all changed TSX. (Swap to a specific named
  tool if one is preferred.)

---

## 1. Architecture overview

```
Public site (RSC) ──reads──> lib/data/* ──> Supabase (anon key, RLS: published only)
Public forms ──server actions──> Zod validate ──> service-role insert ──> Resend emails
Admin (/admin) ──@supabase/ssr cookie session──> RLS (authenticated) CRUD + image upload (Storage)
Pay link (/pay/[token]) ──> MPGS Hosted Checkout session ──redirect──> hosted page
MPGS ──webhook──> /api/payments/webhook (verify signature, idempotent) ──> mark PAID + receipt email
```

Three Supabase clients in `lib/supabase/`:
1. **`server.ts`** — `@supabase/ssr` cookie-based client for `/admin` (RLS as authenticated user).
2. **`service.ts`** — service-role client, **server-only**, for public form inserts + webhook
   updates (bypasses RLS). **Never** `NEXT_PUBLIC`.
3. **`public.ts`** — anon client for reading published public content (RLS-enforced).

---

## 2. Database schema (Supabase migrations)

SQL migrations under `supabase/migrations/`. Types generated via
`supabase gen types typescript --project-id $SUPABASE_PROJECT_ID` → `lib/supabase/types.ts`.
All tables: `id uuid default gen_random_uuid()`, `created_at`/`updated_at` (trigger-updated),
**RLS enabled**.

| Table | Key columns | Notes |
|-------|-------------|-------|
| `destinations` | slug (uniq), title, tagline, key_attraction, summary, best_for, highlights `text[]`, hero_image, card_image, status (`draft`/`published`), sort_order | Mirrors `Destination` in [lib/travel.ts:1](lib/travel.ts#L1) |
| `tour_packages` | slug (uniq), title, tier, hotels, destinations_summary, duration, image, summary, inclusions `text[]`, price_amount `numeric` null, currency (default `LKR`), deposit_amount null, status, sort_order | Mirrors `TourPackage` |
| `itinerary_items` | tour_package_id fk, day_label, title, description, sort_order | Child of tour_packages, ordered |
| `enquiries` | name, email, phone, package_label, message, status (`new`/`contacted`/`closed`), source | From ContactForm |
| `bookings` | reference (uniq, e.g. `BB-7F3K`), tour_package_id fk, traveller_name, email, phone, travel_dates, travellers `int`, notes, status (`new`/`confirmed`/`awaiting_payment`/`paid`/`cancelled`), quoted_amount null, currency | From BookingRequestForm |
| `payments` | booking_id fk, mpgs_order_id (uniq), mpgs_session_id, mpgs_transaction_id, amount, currency, status (`initiated`/`pending`/`captured`/`failed`/`refunded`), pay_token (uniq), pay_token_expires_at, gateway_result `jsonb` | One active pay-link per booking |
| `profiles` | id = auth.users.id, role (`admin`), full_name | Gates admin access |
| `site_settings` | key (uniq), value `jsonb` | Editable contact info / hero copy (optional, recommended) |

### RLS policies (production-critical)
- `destinations`, `tour_packages`, `itinerary_items`, `site_settings`: **public SELECT where
  `status = 'published'`** (all rows for settings); **authenticated** full CRUD.
- `enquiries`, `bookings`, `payments`: **no anon access**; inserts via service role; **authenticated**
  SELECT/UPDATE.
- `profiles`: user reads own row; admin check via `auth.uid()` + role.
- Ship explicit integration tests proving anon **cannot** read drafts, bookings, enquiries, or payments.

### Seed
`scripts/seed.ts` imports the arrays from [lib/travel.ts](lib/travel.ts) and inserts them so no
content is lost. After seeding, remove `lib/travel.ts`; its `getDestination` /
`getTourPackage` / `*Slugs` helpers ([lib/travel.ts:419-433](lib/travel.ts#L419-L433)) are
replaced by `lib/data/*`.

---

## 3. Application changes

### 3.1 Data-access layer — `lib/data/`
Typed functions wrapping Supabase queries, used by RSC pages and admin:
- `packages.ts` — `getPublishedPackages()`, `getPackageBySlug()`, `getPackageSlugs()`, admin CRUD.
- `destinations.ts` — same shape, mirrors the current `lib/travel.ts` helpers.
- `enquiries.ts`, `bookings.ts`, `payments.ts` — create / list / update + status transitions.
- Public reads wrapped with Next cache + `cacheTag('packages')` / `cacheTag('destinations')`;
  admin mutations call `revalidateTag(...)` for instant public updates.

### 3.2 Public pages refactor
- [app/page.tsx](app/page.tsx), [app/tours/page.tsx](app/tours/page.tsx),
  [app/destinations/page.tsx](app/destinations/page.tsx), [app/[slug]/page.tsx](app/[slug]/page.tsx),
  [app/booking/[slug]/page.tsx](app/booking/[slug]/page.tsx) and section components
  ([components/Tours.tsx](components/Tours.tsx), [components/Destinations.tsx](components/Destinations.tsx),
  [components/DestinationGrid.tsx](components/DestinationGrid.tsx),
  [components/TourPackageList.tsx](components/TourPackageList.tsx)) switch from importing
  `lib/travel.ts` to `lib/data/*`.
- `generateStaticParams` reads slugs from DB; set **`dynamicParams = true`** so new slugs resolve
  without a rebuild; rely on tag revalidation for freshness.

### 3.3 Enquiry form (real submission)
- Rewrite [app/actions.ts](app/actions.ts) `submitEnquiry`: Zod validation
  (`lib/validation/enquiry.ts`), honeypot + time-trap + per-IP throttle, insert via service-role
  client, send (a) staff notification + (b) customer acknowledgement via Resend, return
  `EnquiryState`. Keep the `useActionState` progressive enhancement in
  [components/ContactForm.tsx](components/ContactForm.tsx).

### 3.4 Booking form (real submission, no payment here)
- Convert [components/BookingRequestForm.tsx](components/BookingRequestForm.tsx) to submit via a
  server action `submitBooking`: Zod validation, insert `bookings` (status `new`), staff +
  customer emails, return the generated `reference`. **Remove the mock card fields** — payment
  happens later via the pay link, matching the existing "amount confirmed after planner review"
  copy ([app/booking/[slug]/page.tsx:128-141](app/booking/[slug]/page.tsx#L128-L141)).

### 3.5 Admin dashboard — `app/admin/`
Protected by `middleware.ts` (Supabase `@supabase/ssr` session) + a `requireAdmin()` guard.
- `app/admin/login/page.tsx` — Supabase Auth (email + password).
- `app/admin/page.tsx` — overview (counts, recent enquiries/bookings).
- `app/admin/packages/` — list / create / edit with **itinerary editor** (add/reorder/remove
  days) + **image upload** to Supabase Storage bucket `media`.
- `app/admin/destinations/` — list / create / edit with **highlights editor** + image upload.
- `app/admin/enquiries/` — list + detail + status change.
- `app/admin/bookings/` — list + detail; **set quoted amount → "Generate pay link"** (creates a
  `payments` row with random token + expiry, sets booking `awaiting_payment`, emails customer);
  view payment status; manual status override.
- `app/admin/settings/` — edit `site_settings` (contact details, hero copy) — optional.
- All mutations = server actions with shared Zod schemas (`lib/validation/`), `revalidateTag`
  after writes.

### 3.6 Payments — MPGS Hosted Checkout (deferred pay-link)
- `lib/payments/mpgs.ts` — gateway client:
  - `createCheckoutSession(order)` → `POST {BASE}/api/rest/version/{VERSION}/merchant/{MERCHANT_ID}/session`
    with body
    `{ apiOperation: "INITIATE_CHECKOUT", interaction: { operation: "PURCHASE", returnUrl, merchant: { name } }, order: { id, amount, currency, description } }`,
    **Basic auth** `merchant.{MERCHANT_ID}` / API password. Returns `session.id`.
  - `retrieveOrder(orderId)` → `GET .../order/{orderId}` to confirm `result=SUCCESS` &
    `status=CAPTURED` server-side.
  - `verifyWebhook(payload, headers)` → HMAC/secret verification.
- `app/pay/[token]/page.tsx` — server loads payment+booking by `pay_token` (service role);
  validates not expired / not already paid; renders summary + "Pay securely" button.
- `app/pay/[token]/PayButton.tsx` (`"use client"`) — loads
  `{BASE}/static/checkout/checkout.min.js`, calls `Checkout.configure({ session: { id } })`
  then `Checkout.showPaymentPage()`.
- `app/pay/[token]/result/page.tsx` — return URL; server-side `retrieveOrder` to confirm,
  update `payments` + `bookings`, show result.
- `app/api/payments/create-session/route.ts` — server route the PayButton calls to mint a
  session (keeps the API password server-side).
- `app/api/payments/webhook/route.ts` — **source of truth**: verify signature, idempotent on
  `mpgs_order_id`, set `payments.status`, mark `bookings.status='paid'`, send receipt email.
- **`PAYMENTS_ENABLED` flag:** while credentials are pending, gateway calls are gated; admins can
  mark a booking paid manually so the whole flow is testable and shippable now. Flip the flag
  when creds arrive.

### 3.7 Email — `lib/email/`
- `client.ts` — Resend client.
- `templates/` — React Email components: `EnquiryStaffNotification`, `EnquiryAck`,
  `BookingStaffNotification`, `BookingAck`, `PayLink`, `PaymentReceipt`.
- `send.ts` — typed senders used by actions / webhook.

---

## 4. New dependencies

**Runtime:** `@supabase/supabase-js`, `@supabase/ssr`, `resend`, `react-email`,
`@react-email/components`, `zod`. Optional throttle: `@upstash/ratelimit` + `@upstash/redis`.

**Dev/test:** `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`,
`@testing-library/jest-dom`, `@testing-library/user-event`, `@playwright/test`, `supabase`
(CLI), `eslint-plugin-react-hooks`, `react-scan`, `babel-plugin-react-compiler`.

---

## 5. `.env.example` (created at repo root alongside this doc)

```bash
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # SERVER ONLY — never expose
SUPABASE_PROJECT_ID=your-project-ref               # for `supabase gen types`

# --- App ---
NEXT_PUBLIC_SITE_URL=http://localhost:3000          # used for return URLs / pay links
ADMIN_ALLOWED_EMAILS=ops@beyondborders.lk           # comma-separated staff allowlist

# --- Email (Resend) ---
RESEND_API_KEY=re_xxx
EMAIL_FROM="Beyond Borders <bookings@beyondborders.lk>"
EMAIL_TEAM_INBOX=bookings@beyondborders.lk

# --- Payments: Mastercard Payment Gateway Services (Seylan Bank) ---
PAYMENTS_ENABLED=false                               # true once live creds arrive
MPGS_BASE_URL=https://test-seylan.mtf.gateway.mastercard.com  # MTF/test; swap for prod
MPGS_API_VERSION=100
MPGS_MERCHANT_ID=your-merchant-id                    # pending from bank
MPGS_API_PASSWORD=your-api-password                  # pending from bank — SERVER ONLY
MPGS_MERCHANT_NAME=Beyond Borders
MPGS_CURRENCY=LKR
MPGS_WEBHOOK_SECRET=your-webhook-secret              # from Merchant Administration
PAY_LINK_TTL_HOURS=72

# --- Optional rate limiting (Upstash) ---
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 6. Testing strategy (strong, required)

**Unit (Vitest):** Zod schemas; `lib/payments/mpgs.ts` with mocked `fetch` (session creation,
order retrieval, webhook signature verify, idempotency); pay-token generation/expiry; email
template rendering; data mappers; booking-reference generator.

**Component (RTL + user-event):** `ContactForm` and `BookingRequestForm` (validation,
pending/disabled states, success/reference display, accessible labels / `aria-live`); admin
package/destination forms (itinerary + highlights editors); `Select` accessibility.

**Integration (local Supabase via `supabase start`):** server actions against a real test DB;
**RLS proof tests** (anon blocked from drafts / bookings / enquiries / payments); seed migration
correctness; revalidation tags fire.

**E2E (Playwright):** public — browse destinations/tours, submit enquiry, submit booking → see
reference. Admin — login, create/edit package with image upload, generate pay link, mark paid.
Payment — `/pay/[token]` happy path + expired/used token, **with MPGS mocked** (plus a documented
manual MTF run once creds land). Webhook — POST simulated MPGS notifications
(success/failure/duplicate) and assert idempotent state.

**CI (GitHub Actions):** `lint` → `typecheck` → `unit` → `component` → `integration` (Supabase
service container) → `e2e` → `build`. Coverage thresholds enforced (target ≥80% on `lib/`).

**React code-health gate ("React Doctor"):** enable React Compiler
(`experimental.reactCompiler` in [next.config.ts](next.config.ts)), `eslint-plugin-react-hooks`
in `recommended`, `react-scan` render profiling on key pages, and a React best-practices review
pass on all changed TSX. Required pre-merge gate.

---

## 7. Security / production-readiness checklist
- Service-role key + MPGS API password are server-only; RLS on every table.
- Zod validation on all inputs; honeypot + throttle on public forms (optional Vercel BotID).
- Webhook signature verification + idempotency; pay tokens cryptographically random, single-use,
  expiring.
- No card data stored (Hosted Checkout, SAQ-A); HTTPS return URLs.
- Structured error handling / logging; graceful failure when `PAYMENTS_ENABLED=false`.

---

## 8. Implementation phases (build order)
0. **Write `backend.md`** (this doc) + `.env.example`. ✅ done in this step.
1. Supabase project + migrations + RLS + generated types + 3 clients + seed from `lib/travel.ts`.
2. Refactor public pages/components to `lib/data/*`; remove `lib/travel.ts`; tag-based revalidation.
3. Admin auth (middleware + login + `requireAdmin`) + dashboard shell.
4. Admin CRUD for packages & destinations + Storage image upload.
5. Wire enquiry + booking forms (validation, insert, Resend emails); admin enquiry/booking lists.
6. Payments: MPGS client, pay-link generation, `/pay/[token]`, result page, webhook, receipts
   (gated by `PAYMENTS_ENABLED`).
7. Testing suite (unit → component → integration → e2e) + CI + React Doctor gate.
8. Docs polish + final production hardening pass.

---

## 9. Verification (end-to-end, after build)
- `supabase start` + run migrations + seed → confirm 14 destinations / 4 packages present.
- `npm run dev` → public pages render from DB; submit enquiry and booking → rows appear, emails
  sent (Resend test), booking shows reference.
- Admin: log in, create/edit a package with image upload → public page updates after
  revalidation. On a booking, set amount → generate pay link → email received.
- `/pay/[token]` → (mock gateway) complete payment → webhook marks `paid` → receipt email;
  verify expired/used token rejected.
- `npm run lint && npm run typecheck && npm run test && npm run test:e2e && npm run build` all
  green; coverage thresholds met; React Doctor gate passes.
- Once bank credentials arrive: set live `MPGS_*` + `PAYMENTS_ENABLED=true`, run one real MTF
  transaction end-to-end.

---

## 10. References (Seylan = Mastercard MPGS)
- [MPGS — Initiate Checkout (Hosted Checkout) API](https://ap-gateway.mastercard.com/api/documentation/apiDocumentation/rest-json/version/latest/operation/Hosted%20Checkout:%20Initiate%20Checkout.html?locale=en_US)
- [Implementing a Hosted Checkout Integration (Mastercard test gateway)](https://test-gateway.mastercard.com/api/documentation/integrationGuidelines/hostedCheckout/integrationModelHostedCheckout.html)
- [MPGS Integration Guides and Samples](https://github.com/scriptpapi/MPGS-Integration-Guides-and-Samples/blob/main/docs/hosted-checkout.md)
- Seylan MTF base URL: `https://test-seylan.mtf.gateway.mastercard.com` (API version 100)
