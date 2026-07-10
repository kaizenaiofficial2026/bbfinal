# Beyond Borders — Feature Audit

**Date:** 2026-07-10 · **Method:** actor × surface/state requirements matrix per feature (see [FEATURE_SPEC.md](./FEATURE_SPEC.md)), code checked against every cell. Read-only audit — no code changed.

Actors evaluated everywhere: **Guest** (not logged in) · **Customer-unverified** (active, `verified=false`) · **Customer-verified** · **Customer-deactivated** (`active=false`) · **Admin** · **Super-admin**.

---

## Executive summary

**The fundamentals are strong.** Access guards are consistently applied, checkout re-prices server-side (no trust-the-client money bug), draft/unpublished packages can't be fetched by guessing a slug or via any API, and **every admin action is correctly gated server-side at the right tier** (no unguarded or wrong-tier admin action exists — the most important thing to find, and it's clean).

**The gaps are the "obvious overlooked" class** — exactly the pattern behind your original cart bug. Two are worth fixing this week; the rest are medium/low polish and correctness items.

**Top gaps:**
1. 🔴 **Cart isn't cleared on logout / account-delete** → on a shared browser, the next user sees the previous user's cart items. (sibling of your original cart bug)
2. 🔴 **Custom-quote rate limit is bypassable** by rotating the email field → one IP can send unlimited inquiries, each costing a DB write, a staff email, **and a paid SMS**.
3. 🟠 **`/cart` page has no server-side auth gate** → a guest can open the cart page by URL (checkout is still blocked, but it shouldn't render). The exact class of bug you hit, still present on the route.
4. 🟠 **Account "bookings" and "delete account" silently mislead on failure** → a DB error shows "no bookings," and a missing service key makes account-deletion *report success without deleting*.

---

## Master gap list (prioritized)

| # | Sev | Area | Issue | File | Fix |
|---|---|---|---|---|---|
| 1 | 🔴 High | Cart | Cart not cleared on logout/account-delete → cross-user leak on shared browser | `components/cart/CartProvider.tsx:40,52` | Clear cart client-side on sign-out, or namespace `STORAGE_KEY` by user id and drop when `authenticated` flips false |
| 2 | 🔴 High | Inquiries | Custom-quote limiter keyed on attacker-controlled `email` → bypass = unlimited DB+email+**paid SMS** | `app/[locale]/custom-quote/actions.ts:218` | Key on bare `ipHash` (like the enquiry form) and/or enforce `countRecentCustomInquiriesByIp` before insert |
| 3 | 🟠 Med | Cart | `/cart` route renders for anyone (no server gate) | `app/[locale]/cart/page.tsx:12` | `await requireCustomer("/cart")` at top of the page |
| 4 | 🟠 Med | Account | Bookings query error discarded → real bookings shown as empty state | `app/[locale]/account/page.tsx:97` | Capture `error`; render an error state, not empty |
| 5 | 🟠 Med | Account | Delete-account no-ops but reports success if service key missing / `deleteUser` errors | `app/[locale]/account/actions.ts:216` | Fail loudly if service unavailable; check `deleteUser` error |
| 6 | 🟠 Med | Auth | Admin (no `customers` row) logging in via `/login` → redirect loop | `app/[locale]/account/actions.ts:180` | Detect missing customer row; route admins to `/admin` |
| 7 | 🟠 Med | Inquiries | IP-only volume backstops (`countRecent*ByIp`) are **dead code** — the fix for #2 is written but never called | `lib/data/custom-inquiries.ts:34`, `lib/data/enquiries.ts:28` | Wire them into both actions before insert |
| 8 | 🟠 Med | Inquiries | `checkEmailDeliverable` DNS lookup runs **before** the rate-limit check → unthrottled DNS amplification | `app/actions.ts:69`, `custom-quote/actions.ts:198` | Move deliverability call to after the limiter |
| 9 | 🟠 Med | Cart | Unverified customer can add-to-cart & reach checkout button with no upfront signal (only blocked after clicking) | `components/BookingRequestForm.tsx:221` | Gate the CTA on `verified`, or show a "pending approval" hint |
| 10 | 🟠 Med | Cart | No idempotency on `createOrder` → replayed submit can duplicate orders | `lib/data/orders.ts:56` | Idempotency key (hash of user+items+startedAt) or unique constraint |
| 11 | 🟠 Med | Admin | `admin_sid` cookie hard-expires at 24h and is never slid → active admin force-logged-out with a **false "inactivity"** message | `lib/admin/session.ts:234` | Re-issue the cookie on each heartbeat (or set maxAge above the auth-session lifetime) |
| 12 | 🟠 Med | Admin | Single-session model (one shared account) vs tier model (multiple emails) are contradictory | `lib/admin/session.ts:133`, `lib/admin/auth.ts:82` | Decide the model; if tiers are real, store the active seat in a shared table, not per-user metadata |
| 13 | 🟡 Low | Auth | No "already authenticated" redirect on login/register/forgot/reset; re-register silently switches accounts | auth pages | `if (await getCustomerUser()) redirect('/account')` |
| 14 | 🟡 Low | Auth | Deactivated customer can complete a password reset (no login gained) | `lib/auth/password-reset.ts:61` | Filter inactive in `resolveAuthUser`, or document as intended |
| 15 | 🟡 Low | Auth | Deactivation check fails **open** on a query error | `app/[locale]/account/actions.ts:181` | Treat select error as deny |
| 16 | 🟡 Low | Auth | Orphaned auth user if `customers` upsert fails | `app/[locale]/account/actions.ts:131` | Delete the auth user before erroring |
| 17 | 🟡 Low | Auth | Reset verify matches by email only, not `audience` | `lib/auth/password-reset.ts:191` | Add `.eq("audience", audience)` |
| 18 | 🟡 Low | Inquiries | Contact `country` collected+emailed but never stored → admin can't display it | `app/actions.ts:99` + `enquiries` table | Add `country` column, or drop the field |
| 19 | 🟡 Low | Public | Catalog grids have no empty state → blank section if unpublished / env missing | `TourPackageList.tsx`, `DestinationGrid.tsx` | Add "no tours available — request a custom quote" fallback |
| 20 | 🟡 Low | Payments | Stale `Customers read own payments` RLS policy (keys on always-null `booking_id`) | `supabase/migrations/…customer_accounts.sql:73` | Rewrite to traverse `bookings.payment_id`; retire the service-role workaround |
| 21 | 🟡 Low | Payments | Pay token rides in URL with no owner binding | `app/[locale]/pay/[token]/page.tsx:16` | Bind token to the ordering user's session when logged in; token-only for emailed links |
| 22 | 🟡 Low | Admin | `savePackageAction`/`saveDestinationAction` use `.parse()` → raw `ZodError` shown in UI | `app/admin/actions.ts:326,375` | Switch to `safeParse` + friendly note |
| 23 | 🟡 Low | Admin | `error.tsx` renders raw `error.message` (Supabase strings) to admins | `app/admin/error.tsx` | Generic message + logged detail |
| 24 | 🟡 Low | Admin | `proxy.ts` only checks *some* user is logged in for `/admin/*`, not admin role → brief super-nav flash for a customer | `proxy.ts:32`, `app/admin/layout.tsx:22` | Check role in middleware; default `isSuperAdmin` to `false` |
| 25 | 🟡 Low | Admin | `settingsSchema` + `site_settings` table exist but there's **no editor** (scaffolded, unbuilt) | `lib/validation/admin.ts`, `app/admin/settings` | Build the editor or remove the dead schema |
| 26 | 🟡 Low | Inquiries | Post-insert email failure returns "inquiryError" though row is saved → duplicate resubmits | `custom-quote/actions.ts:275` | Treat post-persist email failure as success |

---

## 1. Auth & Account

**Access matrices — all correct** for register, login, logout, account page, change-password, delete-account, password reset. Guards (`requireCustomer`, `requireVerifiedCustomer`, `getCustomerUser`) are consistently applied; **no customer mutation uses an unguarded session**. Deactivation is enforced at login and on every gated page. OTP reset is single-use, hashed, rate-limited, constant-time compared — well built.

**Login matrix (representative):**

| Actor | Behaviour |
|---|---|
| Guest | Signs in → `next` or `/account` |
| Deactivated | ✅ Blocked: post-sign-in `active===false` → `signOut()` + error |
| Unverified / Verified | Sign in normally |
| Admin (no `customers` row) | ⚠️ Loops `/login`→`/account`→`/login` (Gap #6) |

**Findings:** #4 (empty-state on error), #5 (fake delete success), #6 (admin login loop), #13–17 (low-severity polish). See master table.

---

## 2. Cart, Checkout & Payments

**Cart matrix (actor × surface):**

| Actor | See cart button | Open modal | Reach `/cart` by URL | Checkout / pay | Shows in admin |
|---|---|---|---|---|---|
| **Guest** | ❌ hidden | ❌ | ⚠️ **page renders** (Gap #3) | ❌ blocked server-side | — |
| **Customer-unverified** | ✅ if items | ✅ | ✅ | ❌ → `/account` (no upfront signal, Gap #9) | — |
| **Customer-verified** | ✅ if items | ✅ | ✅ | ✅ full flow → `/pay/{token}` | ✅ order visible |
| **Customer-deactivated** | ❌ forced logout | ❌ | ✅ (empty/stale) | ❌ blocked | — |
| **Admin** | ❌ (no customer row) | ❌ | ✅ (empty) | n/a | ✅ sees all orders |

**Your two original bugs:** "guest could access" → closed for the FAB/add/checkout, **but not the `/cart` route** (Gap #3). "not shown in admin" → **genuinely closed** (multi-package orders group by `payment_id` and show as one row with all items).

**Money-safety: solid.** Server re-prices every package by id, rejects unpublished/mixed-currency, ignores client amounts (`orders.ts:68`). Webhook verifies secret (constant-time), reconcile is idempotent and race-safe, expired tokens handled everywhere.

**Findings:** #1 (cart leak — High), #3 (`/cart` gate), #9 (unverified CTA), #10 (idempotency), #20–21 (payments low). One business question flagged: **travellers count doesn't affect price** (`orders.ts:98` sums flat package price) — consistent client/server so not a bug, but confirm per-person pricing isn't intended.

---

## 3. Booking, Inquiries & Public Catalog

**Draft/unpublished isolation — confirmed safe.** Every public read applies `.eq("status","published")` (slug pages, lists, `generateStaticParams`); no `app/api/*` route exposes packages/destinations. A guest cannot see a draft.

**Booking form** — properly gated (UI + server re-check with `requireVerifiedCustomer`), validated, rate-limited on bare IP. Solid.

**Contact/enquiry form** — validated, rate-limited on bare IP (correct). Only gap: `country` never persisted (#18).

**Custom quote** — strong validation/UX, **but** the rate limiter is bypassable (#2 High) and its intended IP backstop is dead code (#7). DNS lookup precedes the limiter on both public forms (#8).

**places/cities API** — clamped, capped, per-instance rate-limited; residual is per-instance-not-global (low, relies on Vercel platform limits).

---

## 4. Admin Panel

**Access matrix: clean — no gap.** Every one of the ~20 admin server actions calls `requireAdmin` or `requireSuperAdmin`; every page gates; super-admin-only capabilities (packages/destinations CRUD, deletes, enquiry/inquiry status) are enforced **server-side in the action**, not just hidden in nav. Dashboard even avoids fetching super-only data for plain admins. `deletePackage` refuses when bookings exist; `deleteCustomer` detaches bookings before deleting. Empty/error states present on every list/detail page.

**Findings:** #11 (24h session force-logout with false message — the most user-visible), #12 (session-vs-tier model contradiction — worth a design decision), #22–25 (low polish). No High-severity admin issues.

---

## Recommended remediation order

**This week (cheap, real exposure):**
- #1 Cart clear on logout/delete · #2 + #7 custom-quote rate-limit (wire the dead-code backstop) · #3 `/cart` gate · #5 fake delete-success · #4 account empty-vs-error state.

**Soon:** #6 admin login loop · #8 DNS-before-limit · #9 unverified CTA signal · #10 order idempotency · #11 admin session TTL.

**Design decisions (not just code):** #12 single-session vs tiers · the travellers/pricing question · #21 pay-token binding.

**Backlog polish:** the remaining 🟡 Low items.

> Turn each fix into a test as you go (the ❌ cells especially — "guest cannot open `/cart`", "unverified cannot checkout"), so these can never silently regress. Add `test:e2e` to CI so those tests actually gate deploys.
