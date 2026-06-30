# Beyond Borders — Developer Guide

**Technical Reference & Handover for the Beyond Borders Platform**

| | |
|---|---|
| **Document** | Developer Guide |
| **Project** | Beyond Borders Website & Admin Platform |
| **Version** | v1.0 |
| **Maintained by** | Kaizen AI |
| **Prepared by** | Kaizen AI for Beyond Borders |

---

## Table of Contents

1. [Purpose & Scope](#1-purpose--scope)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Folder Structure](#4-folder-structure)
5. [Local Development Setup](#5-local-development-setup)
6. [Deployment & Continuous Integration](#6-deployment--continuous-integration)
7. [Environment Variables](#7-environment-variables)
8. [Database Schema & Data Model](#8-database-schema--data-model)
9. [Security Measures](#9-security-measures)
10. [Testing & QA](#10-testing--qa)
11. [Performance & Load/Stress Testing](#11-performance--loadstress-testing)
12. [Internationalization (i18n)](#12-internationalization-i18n)
13. [Payments (MPGS / Seylan)](#13-payments-mpgs--seylan)
14. [Future Development Notes](#14-future-development-notes)
15. [Backup & Recovery](#15-backup--recovery)
16. [Appendix — Command & Troubleshooting Reference](#16-appendix--command--troubleshooting-reference)

---

## 1. Purpose & Scope

This guide documents the technical design of the Beyond Borders platform so that any qualified developer can understand, run, extend, and maintain it. Under the current arrangement, **Kaizen AI hosts and maintains the live system**; this document also serves as the technical reference handed to Beyond Borders for transparency and continuity.

### Ownership at a glance

- The **source code**, **hosting (Vercel)**, and **database (Supabase)** are managed by Kaizen AI on behalf of Beyond Borders under the maintenance agreement.
- The **domain** (`beyondborders.lk`) and the **payment gateway (MPGS / Seylan Bank merchant account)** are owned directly by Beyond Borders.
- Full credential details live in the separate *Ownership, Credentials & Maintenance* document and in the team password manager — **never in this repository**.

### What this platform is

A bilingual-by-design (7 languages), server-rendered marketing + booking site for a Sri Lankan luxury travel operator, plus a full staff admin panel. It supports:

- Public marketing pages (home, about, tours, destinations, destination detail pages).
- Lead capture: contact enquiries and a 4-step "custom quote" wizard (package / hotel / air ticket / transport).
- Customer accounts with **admin-approval gating** before a customer may purchase.
- Online booking and **deferred card payment** via Mastercard Payment Gateway Services (MPGS) Hosted Checkout.
- A staff admin panel: content CMS (packages, destinations), enquiries, custom inquiries, bookings, payments, customers, settings, and first-party web analytics.

---

## 2. Architecture

The platform is a modern server-rendered web application with a managed Postgres backend. Requests flow from the visitor's browser through Vercel's edge/CDN layer to the Next.js application (server components + server actions + a few route handlers), which reads and writes data in Supabase Postgres under Row-Level Security.

| Layer | Responsibility | Provider / Technology |
|---|---|---|
| **DNS & Domain** | Domain routing for `beyondborders.lk` | Registrar owned by Beyond Borders |
| **CDN / Edge / SSL** | Static asset caching, TLS termination, edge routing | **Vercel Edge Network** |
| **Hosting / App** | Serves the public site + admin app; runs server logic (SSR, server actions, route handlers, middleware) | **Vercel** (Fluid Compute, Node.js runtime) |
| **Database & Auth** | Stores packages, bookings, enquiries, customers, payments; user authentication & sessions | **Supabase / PostgreSQL** (with RLS) |
| **File Storage** | Admin-uploaded images (packages, destinations) | **Supabase Storage** (`media` public bucket) |
| **Payments** | Card payment processing | **MPGS Hosted Checkout** (Mastercard Payment Gateway Services, Seylan Bank acquirer) |
| **Email** | Transactional email (enquiry/booking notifications, pay links, receipts, OTP codes) | **Zoho SMTP** via Nodemailer + React Email |
| **SMS** | Booking/enquiry notifications | **smslenz.lk** *(built, disabled — future phase)* |
| **Web Analytics** | First-party page views + product analytics | Self-hosted `page_views` table + **Vercel Analytics / Speed Insights** |

### Request flow (high level)

```
Browser
  │  HTTPS
  ▼
Vercel Edge (CDN, TLS, security headers)
  │
  ▼
Next.js App (proxy.ts middleware → next-intl locale routing + auth session refresh + /admin gate)
  │
  ├── Server Components / Server Actions ──► Supabase Postgres (RLS)
  │                                          └─► Supabase Storage (media)
  ├── /api/payments/* ───────────────────► MPGS Hosted Checkout  ◄── 3DS / card capture (browser ↔ gateway iframe)
  ├── /api/track ────────────────────────► page_views (first-party analytics)
  └── Email/SMS side-effects ────────────► Zoho SMTP / smslenz
```

**Rendering model:** Public routes are cached/static where possible; the admin app and authenticated/payment routes are dynamic (server-rendered on demand). Middleware (`proxy.ts`, exported as Next's middleware) runs on every request to handle locale routing, refresh the customer's Supabase session cookies, and gate `/admin/*`.

---

## 3. Tech Stack

Exact, current versions (from `package.json`):

| Concern | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack, React Compiler) | `^16.2.9` |
| **Language** | TypeScript (strict) | `^5` |
| **UI runtime** | React / React-DOM | `^19.2.7` |
| **Styling** | Hand-authored design system in `app/globals.css` (no Tailwind) — white & gold, Soneva/Six Senses–inspired | — |
| **Backend / API** | Next.js **Server Actions** + a few **Route Handlers** under `app/api/*` | — |
| **Database** | Supabase / PostgreSQL | `@supabase/supabase-js ^2.108.1`, `@supabase/ssr ^0.12.0` |
| **Auth** | Supabase Auth (separate customer & staff/admin identities) | — |
| **i18n** | `next-intl` — 7 locales (en, ar, hi, kn, te, ur, zh), `ar`/`ur` RTL | `^4.13.0` |
| **Validation** | Zod | `^4.4.3` |
| **Email** | Nodemailer (Zoho SMTP) + React Email | `nodemailer ^9.0.1`, `@react-email/components ^1.0.12` |
| **Payments** | MPGS Hosted Checkout (custom client in `lib/payments`) | — |
| **Motion / UX** | `motion` (Framer Motion successor) + `lenis` smooth scroll | `motion ^12.40.0`, `lenis ^1.3.23` |
| **Reference data** | airport codes, airline codes, country/state/city pickers | `@nwpr/airport-codes`, `airline-codes`, `country-state-city` |
| **Analytics** | Vercel Analytics + Speed Insights | `@vercel/analytics ^2.0.1`, `@vercel/speed-insights ^2.0.0` |
| **Package manager** | npm | — |
| **Node version** | **Node.js 24** locally; **Node.js 22** in CI and recommended on Vercel | — |

### Testing & tooling stack

| Concern | Technology | Version |
|---|---|---|
| Unit / component / integration | **Vitest** + Testing Library + jsdom | `vitest ^4.1.8`, `@testing-library/react ^16.3.2` |
| Coverage | `@vitest/coverage-v8` | `^4.1.9` |
| End-to-end / browser | **Playwright** | `@playwright/test ^1.60.0` |
| Accessibility | `@axe-core/playwright` | `^4.12.1` |
| Linting | ESLint + `eslint-config-next` + `eslint-plugin-react-hooks` (React Compiler rules) | `eslint ^9.39.4` |
| Type checking | `tsc --noEmit` | — |
| Security audit | Custom static auditor (`tests/security/audit.mjs`) + `npm audit` | — |
| Perf profiling | `react-scan` | `^0.5.7` |
| Scripts runner | `tsx` | `^4.22.4` |

---

## 4. Folder Structure

```
beyond-borders-next/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Public, localized site (7 languages)
│   │   ├── page.tsx              # Home
│   │   ├── about/  tours/  destinations/  contacts/
│   │   ├── [slug]/               # Destination detail pages
│   │   ├── booking/[slug]/       # Per-package booking page
│   │   ├── custom-quote/         # 4-step custom inquiry wizard (+ actions.ts)
│   │   ├── account/              # Customer dashboard (+ actions, password-actions)
│   │   ├── login/  register/  forgot-password/  reset-password/
│   │   ├── pay/[token]/          # Deferred payment link → MPGS hosted checkout
│   │   └── terms/
│   ├── admin/                    # Staff panel (English-only, NOT under [locale])
│   │   ├── login/ (+ waiting/)   # Single-active-admin login + handoff
│   │   ├── forgot-password/  reset-password/
│   │   ├── packages/ (+ [id], new)      # Package CMS
│   │   ├── destinations/ (+ [id], new)  # Destination CMS
│   │   ├── enquiries/ (+ [id])
│   │   ├── custom-inquiries/ (+ [id])
│   │   ├── bookings/ (+ [id])
│   │   ├── users/                # Customers: verify / activate / deactivate
│   │   ├── settings/             # Admin password change, etc.
│   │   ├── _components/
│   │   └── actions.ts            # Admin server actions
│   ├── api/
│   │   ├── admin/{login,session}/      # Admin login + single-session polling
│   │   ├── payments/{create-session,webhook}/   # MPGS session + notifications
│   │   ├── track/                # First-party analytics beacon
│   │   ├── cities/  places/      # Reference-data lookups for forms
│   └── actions.ts                # Public enquiry + booking server actions
├── components/                   # Reusable UI (Header, Footer, forms, DatePicker, Select…)
│   └── account/
├── lib/
│   ├── data/                     # Supabase-backed data access (packages, bookings, analytics, rate-limit…)
│   ├── supabase/                 # server / service-role / public client factories
│   ├── auth/                     # password-reset (OTP) logic
│   ├── admin/                    # admin auth + single-active-session control
│   ├── customer/                 # customer auth guards (requireCustomer / requireVerifiedCustomer)
│   ├── validation/               # Zod schemas (admin, account, custom-inquiry…)
│   ├── payments/                 # MPGS client, reconcile, currency helpers
│   ├── email/ (+ templates/)     # Nodemailer transport + React Email templates
│   ├── sms/                      # smslenz client (disabled by default)
│   ├── security/                 # IP hashing, rate-key scoping, retry-after
│   ├── format/                   # price/date formatting
│   ├── i18n/                     # i18n helpers
│   └── env.ts                    # Centralized, server-only env access
├── i18n/                         # next-intl routing & request config
├── messages/                     # Translation catalogs: en, ar, hi, kn, te, ur, zh (.json)
├── supabase/migrations/          # SQL schema, RLS policies, RPCs, Storage bucket
├── scripts/                      # seed, load test, image optimization, codegen, SMS/email verify
├── tests/                        # unit / component / integration / e2e / security  (see §10)
├── public/                       # static assets (brand, images, flags)
├── proxy.ts                      # Next.js middleware (locale routing + session + /admin gate)
├── next.config.ts                # security headers / CSP, image domains, next-intl plugin
├── playwright.config.ts          # E2E projects (chromium + authed-admin + authed-customer)
├── vitest.config.ts              # unit/component config
├── vitest.integration.config.ts  # integration (test-DB) config
└── .github/workflows/ci.yml      # CI gate
```

---

## 5. Local Development Setup

**Prerequisites:** Node.js 22+ (24 is used locally), npm, and access to the Supabase project (or a local `supabase start` stack).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then fill in real values (see §7)

# 3. Run the dev server (Turbopack)
npm run dev                 # http://localhost:3000
```

To seed content into a fresh database:

```bash
supabase start             # optional: local Supabase stack
npm run seed               # loads destinations + packages (scripts/seed.ts)
```

> **Local-dev gotchas (learned in this project):**
> - When testing the **admin** panel locally, use `http://localhost:3000`, **not** `http://127.0.0.1:3000` — the admin session cookie is host-scoped and the two hosts don't share it.
> - Keep Supabase **email confirmation OFF**. Registration creates the auth user server-side and gates purchasing via the admin-approval `verified` flag; turning on Supabase's own email confirmation breaks the registration flow.
> - Payments are gated by `PAYMENTS_ENABLED`. With it `false`, the booking flow still works but the pay step is inert.

---

## 6. Deployment & Continuous Integration

### Hosting / deploy

Deployment is automated through Vercel's Git integration.

| Branch | Environment | Behaviour |
|---|---|---|
| `master` | **Production** | Auto-deploys to the live site on push/merge. |
| `feature/*` (any non-default branch) | **Preview** | Each push creates a disposable preview URL. |

**Deployment rules of thumb**

- **Never commit secrets.** All environment variables are configured in the Vercel dashboard (and locally in `.env`, which is git-ignored). The static security audit (§9/§10) enforces that `.env*` files are never committed.
- **Database schema changes go through migrations** in `supabase/migrations/`, never by hand-editing production tables. Migrations are timestamp-versioned and additive/idempotent where possible.
- **Promote / rollback** via the Vercel dashboard: each deploy is immutable; rolling back is "promote a previous deployment to production." No code change is required to roll back.
- After changing SMTP or MPGS env in Vercel, **redeploy** so the new values take effect (a known fix for the Zoho 553 "relay" issue was to overwrite the Vercel SMTP env from local and redeploy).

### Continuous Integration (`.github/workflows/ci.yml`)

Runs on **every push and pull request** (Ubuntu, Node 22):

```
npm ci
npm audit --omit=dev --audit-level=high   # fail on high/critical prod vulns
npm run lint                              # ESLint
npm run typecheck                         # tsc --noEmit
npm run test                              # Vitest (unit + component)
npm run build                             # production build must succeed
```

For the **full** production-readiness gate (adds integration, security audit, and the Playwright E2E/a11y/SEO/perf suite), run locally:

```bash
npm run test:all       # tests/run-all.mjs — every layer in sequence, single summary
```

---

## 7. Environment Variables

Actual secret values are **not** stored in this document — they live in Vercel and the team password manager. `.env.example` is the canonical, commented reference. Centralized, server-only access is via `lib/env.ts` (which imports `server-only`, so it can never be bundled to the client).

| Variable | Purpose | Where set | Secret |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Vercel + `.env` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public/anon Supabase key (client) | Vercel + `.env` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged key — **bypasses RLS** | **Vercel only / server only** | **YES** |
| `SUPABASE_PROJECT_ID` | Project ref for `supabase gen types` | Vercel + `.env` | No |
| `NEXT_PUBLIC_SITE_URL` | Base URL for return URLs / pay links / SEO | Vercel + `.env` | No |
| `ADMIN_ALLOWED_EMAILS` | Comma-separated staff allowlist (bootstraps admin profiles, gates admin OTP) | Vercel + `.env` | No |
| `SMTP_HOST` / `SMTP_PORT` | Zoho SMTP host/port (465 SSL or 587 STARTTLS) | Vercel + `.env` | No |
| `SMTP_USER` / `SMTP_PASSWORD` | Zoho mailbox + **app-specific password** | Vercel only | **YES** (password) |
| `EMAIL_FROM` / `EMAIL_TEAM_INBOX` | From-address + staff inbox | Vercel + `.env` | No |
| `PAYMENTS_ENABLED` | Master switch for the payment flow | Vercel + `.env` | No |
| `MPGS_BASE_URL` | Gateway base (test = `test-seylan.mtf…`; **swap for prod**) | Vercel + `.env` | No |
| `MPGS_API_VERSION` | MPGS API version (`100`) | Vercel + `.env` | No |
| `MPGS_MERCHANT_ID` | Merchant ID | Vercel only | sensitive |
| `MPGS_API_PASSWORD` | Gateway API password | **Vercel only / server only** | **YES** |
| `MPGS_MERCHANT_NAME` | Display name on checkout | Vercel + `.env` | No |
| `MPGS_CURRENCY` | Settlement currency — **`USD`** (gateway settles in USD) | Vercel + `.env` | No |
| `USD_TO_LKR_RATE` | Legacy conversion rate (fallback util only; unused while settling in USD) | Vercel + `.env` | No |
| `MPGS_WEBHOOK_SECRET` | Notification secret for webhook verification | **Vercel only** — never committed/pushed | **YES** |
| `PAY_LINK_TTL_HOURS` | Pay-link lifetime (default 72h) | Vercel + `.env` | No |
| `SMS_ENABLED` | Master switch for SMS (off) | Vercel + `.env` | No |
| `SMS_BASE_URL` / `SMS_USER_ID` / `SMS_API_KEY` / `SMS_SENDER_ID` / `SMS_TEAM_CONTACT` | smslenz config (future phase) | Vercel only (key is secret) | key: **YES** |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Reserved for a future Redis-backed limiter (not wired; DB limiter is used instead) | — | — |

**Security discipline**

- Anything prefixed `NEXT_PUBLIC_` is exposed to the browser — **never** put a secret behind that prefix.
- The Supabase **service-role key**, **MPGS API password**, and **webhook secret** are highly sensitive and must exist **server-side only**. A static audit (§9) fails the build if a `"use client"` file references the service-role key.

---

## 8. Database Schema & Data Model

Backend is **Supabase / PostgreSQL** with **14 tables**, all under Row-Level Security. Migrations live in `supabase/migrations/` (timestamp-versioned). The data-access layer is in `lib/data/`, `lib/auth/`, `lib/admin/`, `lib/customer/`.

### Enumerated types

| Enum | Values |
|---|---|
| `content_status` | `draft`, `published` |
| `enquiry_status` | `new`, `contacted`, `closed` |
| `booking_status` | `new`, `confirmed`, `awaiting_payment`, `paid`, `cancelled` |
| `payment_status` | `initiated`, `pending`, `captured`, `failed`, `refunded` |
| `custom_inquiry_type` | `package`, `hotel`, `airticket`, `transport` |
| `staff_role` | `admin` |

### Tables (purpose + key columns)

**Content (public-readable when published):**

- **`destinations`** — destination content. `id`, `slug` (unique), `title`, `tagline`, `summary`, `highlights[]`, `hero_image`, `card_image`, `status`, `sort_order`, `translations` (JSONB, per-locale).
- **`tour_packages`** — tour packages. `id`, `slug` (unique), `title`, `tier`, `hotels`, `duration`, `inclusions[]`, `price_amount numeric(12,2)`, `currency` (default `LKR`; new packages default to `USD` via the app), `deposit_amount`, `status`, `sort_order`, `translations`.
- **`itinerary_items`** — day-by-day itinerary, FK `tour_package_id → tour_packages(id)` `ON DELETE CASCADE`. `day_label`, `title`, `description`, `sort_order`, `translations`.
- **`site_settings`** — global key/value (`key` unique, `value` JSONB). Public-readable; admin-writable.

**Lead capture (admin-readable only):**

- **`enquiries`** — contact-form submissions. `name`, `email`, `phone`, `message`, `status`, `source`, `ip_hash`.
- **`custom_inquiries`** — multi-type quote wizard. `inquiry_type`, `first_name`, `last_name`, `country_city`, `passport_number`, `email`, `mobile`, `details` (JSONB — type-specific fields), `status`, `ip_hash`.

**Booking & payment:**

- **`bookings`** — `reference` (unique), FK `tour_package_id`, `traveller_name`, `email`, `phone`, `travel_dates`, `travellers (>0)`, `status`, `quoted_amount`, `currency`, `ip_hash`, `user_id` (FK `auth.users`, links the customer who booked).
- **`payments`** — FK `booking_id → bookings(id)` `ON DELETE CASCADE`. `mpgs_order_id` (unique), `mpgs_session_id`, `mpgs_transaction_id`, `amount (>0)`, `currency`, `status`, `pay_token` (unique), `pay_token_expires_at`, `gateway_result` (JSONB audit of the full gateway response).

**Identity:**

- **`profiles`** — staff/admin. `id` = `auth.users(id)`, `role` (`admin`), `full_name`.
- **`customers`** — end-user accounts. `id` = `auth.users(id)`, `full_name`, `first_name`, `last_name`, `email`, `phone`, `country`, `city`, `date_of_birth`, `passport_number`, `passport_expiry`, **`verified`** (admin-approval gate for purchasing), `verified_at`, **`active`** (login enable/disable, independent of `verified`). Unique index on `lower(email)`.

**Operational / service-role-only (RLS enabled, *no* policies — zero access for anon/authenticated):**

- **`rate_limit_events`** — sliding-window limiter ledger. `action`, `ip_hash`, `created_at`.
- **`password_reset_codes`** — OTP reset. `email`, `user_id`, `audience` (`customer`/`admin`), `code_hash` (salted SHA-256 — plaintext never stored), `expires_at`, `attempts`, `consumed_at` (single-use).
- **`page_views`** — first-party analytics. `path`, `visitor_hash` (salted IP hash — no raw IP, no cookies), `referrer`, `country`.
- **`admin_login_lock`** — single-active-admin seat. Single-row table (`id boolean PK CHECK(id)`), `user_id`, `email`, `acquired_at`, `expires_at`.

### Functions, triggers & RPCs

- `set_updated_at()` — trigger on all content/identity tables; stamps `updated_at = now()` on UPDATE.
- `is_admin()` — `SECURITY DEFINER`; true when `auth.uid()` is an `admin` in `profiles`. Used throughout RLS.
- `is_verified_customer()` — `SECURITY DEFINER`; true when `auth.uid()` is a `verified` customer.
- `analytics_summary(days)`, `analytics_top_pages(days, max)`, `analytics_daily(days)` — `SECURITY DEFINER`, `STABLE`, `EXECUTE` granted to `service_role` only; power the admin dashboard.
- `acquire_admin_login_lock(user_id, email, expires_at)` — `SECURITY DEFINER`; atomic upsert of the single seat row (claims if free or expired, renews if held by the same user). `EXECUTE` granted to `service_role` only.

### Storage

- **`media`** (public bucket) — admin-uploaded package/destination images. Policies: **public read**; **admin-only** insert/update/delete (`bucket_id = 'media' AND is_admin()`). The Supabase Storage host is whitelisted in `next.config.ts` `images.remotePatterns` so the Next image optimizer can serve uploads (otherwise pages rendering an uploaded image crash).

### RLS access model (summary)

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| destinations / tour_packages / itinerary_items | published **or** admin | admin | admin | admin |
| site_settings | public (all) | admin | admin | admin |
| enquiries / custom_inquiries | admin | service role¹ | admin | — |
| bookings | own (`user_id = auth.uid()`) **or** admin | service role¹ | admin | — |
| payments | own booking (customer) **or** admin | admin² | admin | — |
| customers | own **or** admin | self (`id = auth.uid()`) | admin | admin |
| profiles | own **or** admin | admin | admin | admin |
| rate_limit_events / password_reset_codes / page_views / admin_login_lock | **service role only** (RLS on, no policies) | service | service | service |

> ¹ Anonymous public submissions are written by the **service-role** client (RLS-exempt), then read by staff under RLS. ² Admins insert `payments` when generating a pay link; machine writes (create-session, reconcile) use the service role.

**Entity relationships:** `tour_packages 1—* itinerary_items`, `tour_packages 1—* bookings`, `bookings 1—* payments`, `auth.users 1—1 {profiles | customers}`, `auth.users 1—* bookings` (via `user_id`).

---

## 9. Security Measures

Security is layered: HTTP headers at the edge, authentication & authorization in middleware + page guards, RLS at the database, validation at every input boundary, and abuse controls (rate limiting + anti-spam) on every public write.

### 9.1 HTTP security headers (`next.config.ts`)

Applied to **all** routes (`source: "/:path*"`):

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` (2 years) |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), browsing-topics=()` |
| `Content-Security-Policy` | see below |

**Content-Security-Policy** (origins for MPGS and Supabase are derived from env):

```
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self' 'unsafe-inline' <MPGS_ORIGIN> https://*.gateway.mastercard.com https://va.vercel-scripts.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
font-src 'self' data:;
connect-src 'self' <SUPABASE_ORIGIN> https://*.supabase.co wss://*.supabase.co <MPGS_ORIGIN> https://*.gateway.mastercard.com https://va.vercel-scripts.com https://vitals.vercel-insights.com;
frame-src 'self' <MPGS_ORIGIN> https://*.gateway.mastercard.com;
```

Notes: `'unsafe-inline'` is required for Next's framework inline scripts/styles (no nonce pipeline); `'unsafe-eval'` is added **only in dev** for Fast Refresh. The Mastercard gateway host (`frame-src` / `script-src`) and Supabase (`connect-src`, incl. `wss:` for realtime) are the only third parties. `frame-ancestors 'none'` + `X-Frame-Options: DENY` make the site un-iframeable (anti-clickjacking).

> **Go-live check:** validate the CSP in a real browser across the **live** payment flow before launch — `MPGS_BASE_URL` must point at the **production** Seylan gateway (not `test-seylan.mtf…`), or checkout is silently blocked.

### 9.2 Authentication

- **Supabase Auth** backs two distinct identities sharing one `auth.users` table:
  - **Customers** — self-register (`customers` row, `verified = false`, `active = true`). They can sign in immediately to see their pending status but **cannot purchase** until an admin sets `verified = true`.
  - **Staff/admins** — bootstrapped from `ADMIN_ALLOWED_EMAILS`; on first login a `profiles` row (`role = admin`) is created. Admin identity is checked against the allowlist, not self-service.
- **Session refresh** happens in middleware (`proxy.ts` → `refreshCustomerSession`): the only place that can write rotated auth cookies back to the browser, so a returning customer isn't silently logged out when the short-lived access token expires.
- **Sign-out uses `scope: 'local'`** deliberately — a global sign-out would invalidate the shared admin account's other sessions. (See single-active-admin below.)
- **Single-active-admin seat:** one shared admin account is coordinated via the `admin_login_lock` table + `user_metadata.admin_session`. A new login either claims a free/expired seat, renews its own, or registers a **pending request** that the current holder approves/denies (the `/admin/login/waiting` handoff). Liveness is a lease (active ≈ 60s, refreshed via heartbeat on each admin request; login requests expire ≈ 120s). All seat logic **fails open** so an internal error never locks staff out.

### 9.3 Authorization & route protection

- **Middleware (`proxy.ts`)** gates `/admin/*`: no Supabase user → redirect to `/admin/login`. (Admin is English-only, outside the `[locale]` tree.)
- **Page-level guards** in `lib/customer/auth.ts` and `lib/admin/auth.ts`:
  - `requireCustomer()` → redirect to `/login` if not signed in.
  - `requireVerifiedCustomer()` → redirect to `/account` (pending state) if signed in but not yet verified — this is what hides the booking form from unverified customers.
  - `requireAdmin()` → resolves the admin, **heartbeats** the single-session seat, and redirects to `/admin/login` (with a "superseded" signal) if the seat was taken over.
- **Database RLS** is the final backstop: even if a guard were bypassed, the policies in §8 prevent reading enquiries/bookings/payments/customers without `is_admin()`, and scope customers to their own rows.

### 9.4 Rate limiting (DB-backed sliding window)

`lib/data/rate-limit.ts` → `checkAndRecordRateLimit(action, ipHash, { max, windowMinutes })` counts rows in `rate_limit_events` for `(action, ip_hash)` within the window, records the attempt, and reports `allowed` + an accurate `retryAfterSeconds` (computed from when the oldest counted attempt ages out). It is **fail-open**: any error (including the table not existing yet) logs and **allows** the request, so a limiter fault can never lock real users out.

**Per-action limits in force:**

| Action | Max | Window | Keyed by |
|---|---|---|---|
| `enquiry` (contact form) | 5 | 60 min | IP |
| `booking` | 10 | 60 min | IP |
| `custom-inquiry` | 8 | 60 min | IP + email |
| `register` | 5 | 60 min | IP + email |
| `login` | 10 | 15 min | IP + email |
| `password-reset-request` | 5 | 30 min | IP + email |
| `password-reset-verify` | 10 | 15 min | IP + email |
| `customer-password-change-otp` | 5 | 30 min | IP + email |
| `customer-password-change` | 10 | 15 min | IP + email |
| `admin-password-reset-request` | 5 | 30 min | IP + email |
| `admin-password-reset-verify` | 10 | 15 min | IP + email |
| `admin-password-change-otp` | 5 | 30 min | IP + email |
| `admin-password-change` | 10 | 15 min | IP + email |
| `create-session` (payment) | 20 | 10 min | IP |

A second, **in-memory** fixed-window limiter (`lib/security/ip-rate-limit.ts`, `makeIpRateLimiter`) guards the high-frequency typeahead endpoints `/api/places` and `/api/cities` (which fire per keystroke). It's per-warm-instance, per-IP, capped at `MAX_KEYS = 5000` entries (evicts oldest to bound memory), and fail-open.

**Per-(IP, account) scoping** (`scopedRateKey`, `lib/security/request.ts`): account-bound actions hash `ipHash : email` so users behind a **shared/CGNAT IP** (office Wi-Fi, mobile) each get their own window per account — one person's attempts can't lock everyone else out, while brute-forcing a single account is still throttled. (This fixed an earlier multi-hour shared-IP lockout caused by IP-only keying.)

**IP hashing** (`getRequestIpHash`): prefers the platform-set `x-real-ip` over the left-most `x-forwarded-for` (which a client can spoof to rotate keys), then stores only `SHA-256(ip : service_role_key)`. With no platform IP it uses a **deterministic shared `"unknown"` bucket** (not a random one — random would silently disable the per-IP caps).

### 9.5 Anti-spam on public forms

Every public write form (contact, booking, custom quote) carries two invisible defenses:

- **Honeypot** — a hidden `company` field (`tabIndex={-1}`, `autoComplete="off"`); if a bot fills it, the submission is dropped.
- **Time-trap** — a hidden `startedAt` timestamp; submissions completed in **under 2.5 seconds** (`Date.now() - startedAt >= 2500`) are rejected as automated.

These run **before** any DB write or email send, in addition to the rate limits and per-IP volume counts (`countRecent*ByIp`).

### 9.6 Input validation

All form input is validated server-side with **Zod** schemas in `lib/validation/` (`account.ts`, `enquiry.ts`, `booking.ts`, `custom-inquiry.ts`, `admin.ts`, `air-segments.ts`) before any persistence — server actions `.safeParse()` and return field-level errors without throwing. Coverage includes:

- **Email** — `z.email()` + length cap, plus a **deliverability check** (`lib/validation/email-deliverability.ts`) that verifies MX/A records and blocks reserved domains/TLDs (`.test`, `.example`, `.invalid`, `.localhost`, `example.com`…) so QA addresses never reach the production SMTP.
- **Passwords** — min 8 / max 200 chars, with confirmation-match refinements on register and reset.
- **Dates** — ISO `YYYY-MM-DD`; future-only passport expiry, no past travel dates, return ≥ departure, future-DOB rejection on registration.
- **Numbers / enums** — coerced with bounds (e.g. travellers/rooms 1–50), trip-type and status enums.
- **Cross-field refinements** — e.g. flight origin ≠ destination; round-trip return-date logic.

### 9.7 Payment security

- **MPGS Hosted Checkout** — card data is entered in the gateway's own hosted fields/iframe (PCI scope stays with the gateway, not the app). The app never sees raw PAN/CVC.
- **Pay tokens** — each payment gets a unique, unguessable `pay_token` (**32 random bytes / 256-bit, base64url**, via `crypto.randomBytes`) with a server-set expiry (`pay_token_expires_at`, default 72h via `PAY_LINK_TTL_HOURS`). Expired links render an "expired" state (HTTP 410 on the session endpoint); the token is the only handle exposed in the `/pay/<token>` URL.
- **CSRF / same-origin guard** — `/api/payments/create-session` mutates payment state, so it rejects cross-site callers: the request `Origin` host must equal the `Host` header (a missing Origin, i.e. non-browser, is allowed). It is also rate-limited (20 / 10 min / IP) and returns `429` with `Retry-After` when exceeded.
- **Webhook verification** — gateway notifications hit `/api/payments/webhook` and are verified against `MPGS_WEBHOOK_SECRET` (kept out of the repo entirely) using a **timing-safe** comparison (`crypto.timingSafeEqual`); it **fails closed** (401) on any mismatch, yet returns `200` for an unknown order so the endpoint can't be used to probe for valid order IDs.
- **Reconciliation** (`lib/payments/reconcile.ts`) is the source of truth for moving a payment to `captured` and a booking to `paid`. It is **idempotent and concurrency-safe** — both the webhook and the customer's return page call it, but a guarded update (`.neq("status","captured")`) ensures only one transition fires the receipt email/SMS. Receipt/SMS sends are fail-soft.
- The full gateway response is archived in `payments.gateway_result` (JSONB) for audit.

### 9.8 Password reset (OTP)

`lib/auth/password-reset.ts`:

- A **6-digit numeric code** is emailed; only a **salted SHA-256 hash** (code + email + service-role-key salt) is stored in `password_reset_codes`. Plaintext is never persisted, and verification uses a **timing-safe** hex comparison.
- Codes are **single-use** (`consumed_at`), **short-lived** (15 min, `OTP_TTL_MINUTES`), and **attempt-throttled** (max **5** wrong guesses per code, `MAX_VERIFY_ATTEMPTS`). Issuing a new code invalidates earlier ones; a successful reset burns the code and its siblings.
- **No account enumeration:** requesting a reset for an unknown / non-allowlisted email returns the same "if an account exists, a code was sent" response and sends nothing.
- **Audience separation:** admin resets (`audience = 'admin'`) require the email to be in `ADMIN_ALLOWED_EMAILS` and deliver the code to the **admin security inbox** (`reservations@beyondborders.lk`), not to an arbitrary typed address; customer resets (`audience = 'customer'`) email the customer's own address.

### 9.9 Secrets & data-handling discipline

- `lib/env.ts` imports `server-only` — server secrets can't leak into a client bundle.
- The static auditor (`tests/security/audit.mjs`, see §10) fails on: high/critical prod dependency vulns, committed `.env*` files, hardcoded private keys / JWTs / API secrets, any `"use client"` file referencing the service-role key, and `eval()` / `new Function()` usage; it warns on `dangerouslySetInnerHTML`.
- **Privacy:** analytics store only a **salted IP hash** (no raw IP, no cookies, no PII) — `page_views.visitor_hash`. Rate-limit and analytics tables are service-role-only.
- A reserved-email guard (`isReservedEmailDomain`) skips outbound mail to `*.test` addresses so QA never emails real inboxes.

---

## 10. Testing & QA

The project ships with a deep, multi-layer automated suite plus a documented manual/UAT process. The single command **`npm run test:all`** runs every layer in sequence and prints one pass/fail summary (`tests/run-all.mjs`).

### 10.1 Test layers & counts

| Layer | Tool | Location | Count | What it covers |
|---|---|---|---|---|
| **Type check** | `tsc --noEmit` | whole repo | — | strict TypeScript correctness |
| **Lint** | ESLint (+ React Compiler hook rules) | whole repo | — | code quality; blocks `setState`-in-effect & ref-access-in-render |
| **Unit** | Vitest | `tests/unit/` | **96 tests** across 16 files | validation, dates, formatting, rate-key/IP, retry-after, payment currency, payment tokens, reconcile, security utils, i18n localize, SMS, email deliverability |
| **Component** | Vitest + Testing Library | `tests/component/` | **33 tests** across 9 files | ContactForm, BookingRequestForm, CustomInquiryForm, Combobox, PasswordInput, PayButton, StatusBadge, Toast, TourPackageList |
| **Integration** | Vitest (test DB) | `tests/integration/` | **14 tests** across 3 files | **RLS policies**, password-reset flow end-to-end, data + analytics RPCs |
| **Security audit** | custom Node script | `tests/security/audit.mjs` | 5 check groups | deps, committed secrets, hardcoded secrets, service-key leakage, dangerous patterns |
| **E2E / browser** | Playwright (Chromium) | `tests/e2e/` | **44 tests** across 14 specs | full user journeys, responsiveness, accessibility, SEO, performance, security headers |

**Totals: ~143 Vitest tests (unit + component + integration) and 44 Playwright E2E tests** — ~187 automated checks, plus the static security and type/lint gates.

### 10.2 What the E2E suite verifies (`tests/e2e/`)

Playwright runs three projects: a public **chromium** project, an **authed-admin** project (pre-authenticated via `auth.setup.ts` → `tests/.auth/admin.json`), and an **authed-customer** project.

- `smoke.spec` — every public page renders, no console errors, key sections present.
- `auth.spec` / `account.authed.spec` — register, login (eye toggle, wrong password), forgot/reset (OTP read from DB), account dashboard, change password, logout bounces protected pages.
- `admin.spec` / `admin.authed.spec` — allowlist login, logged-out `/admin*` redirect, dashboard analytics, packages/destinations CMS, enquiries/custom-inquiries/bookings/customers management, verify/deactivate customer, settings, mobile drawer.
- `booking.authed.spec` — unverified customer sees "awaiting verification"; verified customer books → `bookings` + `payments` rows + redirect to `/pay/<token>`.
- `custom-quote.spec` — the 4-step wizard writes a `custom_inquiries` row.
- `tours.spec` — tour listing & detail.
- `responsive.spec` — 375 / 768 / 1280 widths, **no horizontal overflow**.
- `accessibility.spec` — **axe-core** automated a11y scan on key pages.
- `seo.spec` — `robots.txt`, `sitemap.xml` (~26 URLs × 7-locale hreflang), OG/Twitter tags.
- `security-headers.spec` — asserts the CSP/HSTS/X-Frame-Options/nosniff headers from §9.1.
- `performance.spec` — basic performance budget assertions.

### 10.3 Test infrastructure & safety

- **`tests/support/db.ts`** provides `createCustomer({verified})`, `ensureAdmin()`, `seedResetCode()`, `resetCodeHash()`, `cleanupTestData()`, and `service()`/`anon()` Supabase clients.
- **All test data is scoped to `qa-…@beyondborders.test`** and removed by `cleanupTestData()` / `global-teardown.ts`.
- **Emails are suppressed in test** — the transport returns null when SMTP is unset, and the reserved-domain guard skips `@*.test`. OTP flows read the code straight from `password_reset_codes` (no inbox dependency).
- **Important:** the "test" Supabase project **is the live production database**. Any manual test seeding must use the `qa-…@beyondborders.test` scope and be cleaned up.

### 10.4 Live UAT pass (guide-driven)

A 40-check acceptance script (sections A–G: public/nav, lead forms, customer accounts, booking & payment, admin panel, analytics, SEO/technical) is documented in `docs/QA-TESTING-GUIDE.md` and `Beyond-Borders-QA-Checklist.md`, and was executed with Playwright against the live site. Each check is recorded PASS / FAIL / NOTE with evidence. Items that can't be fully automated (real sandbox-card capture + webhook reconcile, translation wording, live SSL) are recorded as **NOTE** with the manual procedure.

### 10.5 Payment testing (sandbox)

The gateway runs against the MPGS **MTF/sandbox** (`MPGS_BASE_URL=https://test-seylan.mtf.gateway.mastercard.com`), so no real money moves.

- **Test card:** Mastercard `5123 4500 0000 0008`, expiry `12/39`, CVC `100`; on the 3DS ACS emulator click **Submit** to authenticate.
- The full flow — create session → hosted checkout (`checkout.min.js`) → 3DS → capture → `/pay/<token>/result` → `reconcilePayment` — was verified end-to-end. A USD capture was confirmed live once the Seylan merchant account was provisioned for USD (the gateway rejects a currency the MID isn't provisioned for, regardless of the API field).

### 10.6 Running the tests

```bash
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint
npm run test               # Vitest unit + component
npm run test:coverage      # + V8 coverage report
npm run test:integration   # integration suite against the test DB
npm run test:security      # static security audit
npm run test:e2e           # Playwright (starts/reuses a server)
npm run test:all           # everything, one summary (production-readiness gate)
```

---

## 11. Performance & Load/Stress Testing

### 11.1 Tooling

A dependency-free load generator ships at **`scripts/loadtest.mjs`**. It maintains a pool of N concurrent workers looping over a weighted mix of public GET routes (homepage-heavy browse incl. tours, destinations, a package detail that exercises the `next/image` Supabase path, about, contacts) for a fixed duration, draining each response body, then reports latency percentiles, throughput, and status distribution.

```bash
node scripts/loadtest.mjs [concurrency] [durationSeconds] [baseUrl]
# e.g.
node scripts/loadtest.mjs 100 30 http://localhost:3000
```

### 11.2 Measured results

Run against a **local production build** (`npm run build && npm run start`) on the developer machine, with the app talking to the **remote** production Supabase over the public internet. The same machine ran both the server and the load generator. Routes were warmed before measuring; a real published package detail page was used.

**Run A — 50 concurrent, 20s**

| Metric | Value |
|---|---|
| Total requests | 1,687 |
| Completed / Errors | 1,687 / **0** |
| Success (2xx/3xx) | **100.00%** |
| Throughput | 84.2 req/s |
| Latency avg / p50 / p90 | 592 / 573 / 708 ms |
| Latency p95 / p99 / max | 838 / 932 / 1,064 ms |

**Run B — 150 concurrent, 20s (3× load)**

| Metric | Value |
|---|---|
| Total requests | 1,794 |
| Completed / Errors | 1,794 / **0** |
| Success (2xx/3xx) | **100.00%** |
| Throughput | 89.0 req/s |
| Latency avg / p50 / p90 | 1,677 / 1,631 / 2,121 ms |
| Latency p95 / p99 / max | 2,266 / 2,686 / 2,759 ms |

### 11.3 Interpretation

- **Zero errors and 100% success at both 50 and 150 concurrent** — the app degrades *gracefully* under 3× load: latency rises (requests queue) but **nothing fails, times out, or 5xx's**.
- Throughput plateaus at **~84–89 req/s** across both runs. That ceiling reflects the **test harness**, not the application: a single laptop was running the Next server *and* the load generator, and every request made a **cross-internet round-trip to remote Supabase**. On Vercel's serverless compute with a co-located/regional Supabase, real-world throughput and tail latency are materially better (no shared-host contention, no WAN DB hop, edge caching of static/ISR routes).
- These numbers are a **stress sanity check** (resilience + graceful degradation), not a production capacity benchmark. For a true capacity figure, run the generator from a separate machine against the Vercel deployment.

### 11.4 Built-in performance posture

- **Rendering:** public routes are cached/static where possible; only authenticated/admin/payment routes are dynamic.
- **Images:** Next image optimizer serves **AVIF/WebP**, `minimumCacheTTL` = 1 year; Supabase Storage host is whitelisted for optimization.
- **Edge headers + HSTS preload**, long-lived immutable static assets via Vercel's CDN.
- **Vercel Speed Insights** captures real-user Core Web Vitals in production; `react-scan` (`npm run react:scan`) is available for local render-cost profiling.
- A Playwright `performance.spec` asserts a basic perf budget in CI-adjacent runs.

---

## 12. Internationalization (i18n)

- **7 locales:** `en`, `ar`, `hi`, `kn`, `te`, `ur`, `zh`. `ar` and `ur` render **RTL** (`dir="rtl"`).
- **`next-intl`** with `localePrefix: "as-needed"` (the default `en` has no prefix; others are `/ar`, `/zh`, …). The admin panel is **English-only** and lives outside `[locale]`.
- Translation catalogs are flat JSON in `messages/<locale>.json`. Messages use ICU MessageFormat (plurals, placeholders, rich-text tags). A render-time helper (`t.has(key)`) allows safe optional lookups.
- **Form option data** (cabin classes, Yes/No, room/meal/car types, etc.) is localized at display time via a `formOptions` namespace in `components/Select.tsx` while the **submitted value stays English**, so server-side Zod validation is unaffected. Proper nouns (hotel brands, car models, place-name brands) intentionally remain in English.
- **Status:** translations are currently machine-generated and pending human editorial proofing; RTL visual QA and static editorial content are tracked as open items.

> When adding any user-facing string, add the key to **all 7** `messages/*.json` files. The i18n test (`tests/unit/i18n-localize.test.ts`) and a key-parity sweep guard against missing keys and malformed ICU.

---

## 13. Payments (MPGS / Seylan)

- **Flow:** admin (or the booking action) creates a payment → `/api/payments/create-session` opens an MPGS Hosted Checkout session → the customer lands on `/pay/<token>` which loads `checkout.min.js` and the gateway's hosted card fields → 3DS → capture → `/pay/<token>/result` → `reconcilePayment` writes the final `payment.status` and flips the `booking.status` to `paid`.
- **Currency:** the Seylan merchant **settles in USD**; prices are charged in **USD with no conversion** (`MPGS_CURRENCY=USD`; new packages default to USD). A legacy USD→LKR converter remains as an unused fallback. The gateway rejects any currency the **merchant ID isn't provisioned for**, independent of the API field — so currency changes require the bank to provision the MID.
- **Master switch:** `PAYMENTS_ENABLED`. Webhooks are verified with `MPGS_WEBHOOK_SECRET` (never committed). The full gateway response is stored in `payments.gateway_result`.
- **Go-live:** switch `MPGS_BASE_URL` from `test-seylan.mtf…` to the **production** Seylan gateway, confirm USD is enabled on the **production** MID, update the CSP origins (derived from env automatically), and re-verify the live flow in a browser.

---

## 14. Future Development Notes

- **SMS notifications** (smslenz.lk) — fully built (`lib/sms/`, `scripts/verify-sms.ts`) but **disabled** (`SMS_ENABLED=false`). Enable once the approved sender ID and business mobile are configured; flip the env and verify with `npm run sms:verify`.
- **Phase 2 / AI enhancements** (AI chat agent, AI receptionist) — see the *Welcome & Thank You Pack* recommendations.
- **i18n** — human proofing of the 7 machine-translated catalogs; RTL visual QA; finalize static editorial copy.
- **Rate-limit housekeeping** — `rate_limit_events`, `password_reset_codes`, and `page_views` grow unbounded; schedule periodic pruning (suggested SQL is in each migration's comments). A Redis-backed limiter (Upstash) is stubbed in env but not wired; the DB limiter is sufficient at current volume.
- **Go-live checklist** (carried): production CSP + `MPGS_BASE_URL` must move off the sandbox gateway; confirm USD on the production MID; deploy the USD pricing change; verify the live payment round-trip.
- Reference data (airlines/countries) is generated by `scripts/gen-*.mjs`; re-run if upstream lists change.

---

## 15. Backup & Recovery

Critical: the database holds **live customer PII** (names, contact details, passport numbers, bookings).

- **Backups:** Supabase managed backups on the project's current plan. **Confirm the plan's backup frequency and retention** meet Beyond Borders' needs — free/low tiers have limited retention and can pause inactive projects. Do not rely on a free tier for a live business.
- **Restore procedure:** restore from a Supabase backup via the Supabase dashboard / CLI (point-in-time or daily snapshot depending on plan). Authorize via the Kaizen AI maintainer; document the expected data-loss window (= time since last snapshot for daily backups).
- **Schema as code:** the full schema and RLS live in `supabase/migrations/`. A clean database can be rebuilt by applying migrations in order, then `npm run seed` for content. Customer/booking/payment **data** still requires a backup restore — migrations only rebuild structure.
- **Disaster-recovery contacts:** maintained in the *Ownership, Credentials & Maintenance* document (who to call, in what order, if the live system is down).
- **Secrets recovery:** all secrets live in Vercel + the team password manager. Losing the repo does not lose secrets; losing the password manager does — ensure it has its own backup/recovery.

---

## 16. Appendix — Command & Troubleshooting Reference

### Command reference

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack), `http://localhost:3000` |
| `npm run build` / `npm start` | Production build / serve |
| `npm run seed` | Seed destinations + packages |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` / `test:watch` / `test:coverage` | Vitest unit+component |
| `npm run test:integration` | Integration suite (test DB) |
| `npm run test:security` | Static security audit |
| `npm run test:e2e` | Playwright E2E/a11y/SEO/perf |
| `npm run test:all` | Full production-readiness gate |
| `node scripts/loadtest.mjs 100 30 <url>` | Load/stress test |
| `npm run email:verify` / `sms:verify` | Verify SMTP / SMS connectivity |
| `npm run react:scan` | Render-cost profiling (server must be running) |

### Troubleshooting (known issues & fixes)

- **Admin session not sticking locally** → use `localhost`, not `127.0.0.1`.
- **Registration fails / user stuck unconfirmed** → ensure Supabase **email confirmation is OFF**; gating is done via the `verified` flag, not Supabase confirmation.
- **Page crashes rendering an uploaded image** ("hostname not configured") → the Supabase Storage host must be in `next.config.ts` `images.remotePatterns` (it is, derived from `NEXT_PUBLIC_SUPABASE_URL`).
- **SMTP 553 "relay" error in prod** → overwrite the Vercel SMTP env from local values and **redeploy**.
- **Payment "currency not supported"** → the production **MID isn't provisioned** for that currency; the bank must enable it (not an app fix).
- **Checkout blocked / blank gateway frame** → CSP `MPGS_BASE_URL` origin mismatch; ensure prod `MPGS_BASE_URL` is set and redeploy.
- **A user appears rate-limited unfairly** → limits are per-(IP, account); to unblock immediately, truncate the relevant rows in `rate_limit_events`. The limiter fails open, so an outage of that table won't lock anyone out.
- **Two dev servers fighting over port 3000** → `pkill -f "next dev"` (and `next start`) before relaunching.

---

*Prepared by Kaizen AI for Beyond Borders. Keep this document in sync with `supabase/migrations/`, `next.config.ts`, and `package.json` — those three files are the source of truth for schema, security headers, and the dependency stack respectively.*
