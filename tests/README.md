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
| 4. Security audit | `npm run test:security` | Dependencies, secrets, key leakage, dangerous patterns |
| 5. E2E / responsive / a11y / SEO / perf | `npm run test:e2e` | Real browser flows against the running app |

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
- **Non-destructive by design.** Tests never complete write-path flows against the
  live database (real registrations, real bookings, real payments). They verify
  rendering, validation and gating. **Full write-path + payment E2E need a
  dedicated seeded test database and an MPGS sandbox** — wire those env vars and
  the booking/registration submit flows can be exercised end-to-end.
- **Performance** here is a dev-server *guardrail*. The real perf gate is a
  Lighthouse run against a production build (`npm run build && npm run start`).
- **Coverage thresholds (65%)** are a ratchet just below the current coverage of
  the unit/component-tested modules. Raising them meaningfully requires
  integration tests against a seeded test DB for the server actions and data
  layer.
- **Visual regression** (pixel snapshots) is not included; the responsive layer
  asserts structural integrity (no overflow) rather than pixels.
