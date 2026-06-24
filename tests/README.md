# Beyond Borders — Test Suite

A layered, production-readiness test suite. **One command runs everything:**

```bash
npm run test:all
```

It executes five gates in order and prints a single PASS/FAIL summary (exits
non-zero if any gate fails):

| Gate | Command | What it checks |
|------|---------|----------------|
| 1. Type check | `npm run typecheck` | `tsc --noEmit` — no type errors |
| 2. Lint | `npm run lint` | ESLint across the codebase |
| 3. Unit & component (+coverage) | `npm run test:coverage` | Pure logic + React components, with coverage thresholds |
| 4. Integration (test DB) | `npm run test:integration` | Server logic against the **test** Supabase: OTP reset, RLS, data, analytics |
| 5. Security audit | `npm run test:security` | Dependencies, secrets, key leakage, dangerous patterns |
| 6. E2E / responsive / a11y / SEO / perf | `npm run test:e2e` | Real browser flows (incl. authenticated admin + customer) |

Each layer can also be run on its own (see the commands above).

---

## What each layer covers

### Unit (`tests/unit/`, Vitest)
- **Validation** — customer registration (names, country/city, DOB in the past,
  passport number + future expiry, honeypot), password-reset and change-password
  schemas, enquiry/booking schemas.
- **Formatters** — package price, currency, dates, status label/tone mapping.
- **Security utils** — token generation (URL-safe, unique), expiry checks,
  booking/inquiry reference shapes, IP-hash determinism (fail-closed).
- **i18n** — locale list, RTL detection, and the translation-fallback helpers
  (`localeFields` / `tField` / `tArray`) that power 7-language content.
- **Payments** — MPGS reconcile logic, pay-token generation.

### Component (`tests/component/`, Vitest + Testing Library)
- `PasswordInput` show/hide toggle, `StatusBadge` label/tone, `TourPackageList`
  pricing (shows/omits price correctly), and the contact/booking forms.

### Integration (`tests/integration/`, Vitest — node, **test DB**)
Runs the real server modules against the test Supabase (`tests/support/db.ts`
creates/cleans data with the `@beyondborders.test` email domain):
- **Password reset / OTP** — a real code is stored hashed and emailed (email
  mocked); a valid code **actually changes the password** (re-login verified); a
  wrong code is rejected + counted; expired codes fail; admin codes only go to
  allowlisted staff.
- **Row-Level Security** — anon clients can't read `customers` / `page_views` /
  reset codes; a signed-in customer reads **only their own** profile; the service
  role bypasses RLS.
- **Data integrity** — 7 published packages, all USD-priced, the 3 new ones
  present, every package has itinerary days.
- **Analytics** — the overview RPCs return live figures; a recorded page view is
  counted.

### Authenticated E2E (`tests/e2e/*.authed.spec.ts`)
A Playwright `setup` project (`auth.setup.ts`) creates an admin + a verified
customer in the test DB and captures their sessions (`tests/.auth/`). Then:
- **Admin** — dashboard (analytics + metrics), packages list, the staff
  change-password form, and **real mutations**: verifying an applicant and
  deactivating a login are confirmed in the database.
- **Customer account** — the signed-in account page + the self-service
  change-password card; the session isn't bounced to login.
- **Booking → payment** — a verified customer submits a booking; the booking +
  payment rows are created (`awaiting_payment` / `initiated`) and the flow
  reaches the **MPGS hosted-checkout** pay page (traveller, amount, pay action).

A global teardown removes all test-DB records after the run.

### End-to-end (`tests/e2e/`, Playwright — Chromium)
- **smoke** — every public page returns < 400, has a title, and throws no
  uncaught JS errors; unknown routes 404.
- **responsive** — **no horizontal overflow** on every key page across 7 widths
  (320 → 1440px); the mobile nav drawer opens/closes.
- **auth** — the redesigned split-panel login/register, the password eye toggle,
  the full registration field set, client-side validation, forgot-password.
- **tours** — all 7 packages list with prices; booking detail shows price,
  itinerary and the reserve card; newly-added packages are live.
- **admin** — dashboard + sub-pages redirect to the login when unauthenticated;
  the staff login renders; forgot-password is reachable; bad credentials rejected.
- **accessibility** — axe-core WCAG 2.1 A/AA scan on the key pages (hard-fails on
  any *critical* violation; *serious* ones are annotated for follow-up).
- **seo** — title, meta description, `<html lang>`, an `<h1>`, and Open Graph tags.
- **performance** — warm-load DOM/Load budgets and no zero-size images (CLS guard).
- **security-headers** — CSP / X-Frame-Options / nosniff / HSTS / Referrer-Policy
  / Permissions-Policy present; the tracking API rejects cross-origin posts.

### Security audit (`tests/security/audit.mjs`)
Static checks: no high/critical production vulnerabilities (`npm audit`), no
committed `.env`, no hardcoded private keys / JWTs / API secrets, the Supabase
**service-role key never appears in a `use client` file**, and no
`eval` / `new Function` / unexpected `dangerouslySetInnerHTML`.

---

## Notes & deliberate boundaries

- **E2E runs against `localhost` (not `127.0.0.1`).** On `127.0.0.1` the Next dev
  HMR WebSocket handshake fails and client islands never hydrate — the Playwright
  config pins `localhost` for this reason.
- **Dev server, served on demand.** E2E reuses a running `npm run dev` (or starts
  one). Playwright runs **1 worker locally** to avoid dev-compile contention; CI
  can raise `--workers`.
- **Write-path runs against the TEST database** (`tests/support/db.ts`), and the
  payment flow against the **MPGS test gateway**. All test data uses the
  `@beyondborders.test` domain and is cleaned up automatically. Point these at a
  fresh prod Supabase / live gateway later — the suite is unchanged.
- **What's still left to a human / a richer environment:**
  - **Completing a card on the MPGS sandbox** — tests reach the hosted-checkout
    page and confirm the payment is *initiated*, but don't drive the third-party
    bank UI to a captured transaction (+ the capture webhook). That's a manual
    sandbox step.
  - **Real email/SMS delivery** — sends are asserted/mocked, not delivered to an
    inbox (SMTP is live; SMS is disabled).
  - **Cross-browser / real devices** — Chromium only (no Firefox/WebKit/touch).
  - **RTL visual correctness** (ar/ur) and translation *quality* across the 6
    non-English locales.
- **Performance** here is a dev-server *guardrail*. The real perf gate is a
  Lighthouse run against a production build (`npm run build && npm run start`).
- **Coverage thresholds (65%)** are a ratchet just below the current coverage of
  the unit/component-tested modules. Raising them meaningfully requires
  integration tests against a seeded test DB for the server actions and data
  layer.
- **Visual regression** (pixel snapshots) is not included; the responsive layer
  asserts structural integrity (no overflow) rather than pixels.
