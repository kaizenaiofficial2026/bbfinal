# Beyond Borders — Full QA & Acceptance Checklist

> **Supersedes** `Beyond-Borders-QA-Testing-Guide.pdf` (the original 40 checks A–G are all retained below, expanded, with new sections H–M added for everything built since).
> Work top to bottom and tick each box. Every check lists **Test** (how) and **Expect** (outcome).

---

## 0. Before you start

- **Environment:** can be run against the **live site** (`https://www.beyondborders.lk`) or a **local production build** (`npm run build && npm run start`) on the test Supabase.
- **Emails are real on live.** Every customer-side test sends a real acknowledgement to the address you use **plus** a copy to `reservations@beyondborders.lk`. To test with zero email noise, blank `SMTP_USER`/`SMTP_PASSWORD` (sends are skipped) or use the test build.
- **Admin account:** an email in `ADMIN_ALLOWED_EMAILS` (currently `reservations@beyondborders.lk`) + its password. Only ONE admin can hold the panel at a time (see §E2).
- **Payments:** the gateway is in **sandbox** (`MPGS_BASE_URL = test-seylan.mtf…`). Do the first real end-to-end payment in test mode and confirm the **charged currency/amount** before going live.
- **Automated coverage:** `npm run test:all` (Vitest + Playwright e2e, ~108 unit/component + ~75 e2e) already covers a large share of this against the test DB. This document is the **manual UAT + full feature map**.
- **Locales:** 7 — `en` (no prefix), `ar`, `hi`, `kn`, `te`, `ur`, `zh`. `ar` + `ur` render right-to-left.

---

## 1. ⭐ Recent changes — focused re-test

The items you specifically changed. (Each is also covered in its full section below.)

- [ ] **RC1 — Custom quote: every field required before submit.** **Test:** open `/custom-quote`, click **Next** on a step leaving any field empty; also try to submit the final step with gaps. **Expect:** you cannot advance/submit; each missing/invalid field shows a red inline error ("This field is required.", date errors, etc.) and the wizard jumps to the first incomplete step. All 4 steps (Package, Hotel, Air ticket, Transport) **and** the guest details must be complete. *(§B2)*
- [ ] **RC2 — Admin change password = website 2-step logic, code only to reservations@.** **Test:** Admin → Settings → enter current + new password → Continue → enter the 6-digit code → save. **Expect:** identical 2-step wizard to the customer flow; the code is sent **only to `reservations@beyondborders.lk`** (never to the person resetting); on success the password changes and you stay logged in. *(§E10)*
- [ ] **RC3 — Admin forgot password: code only to reservations@.** **Test:** `/admin/login` → "Forgot password?" → there is **no email field**; click **Send reset code**. **Expect:** code goes **only to `reservations@beyondborders.lk`**; you land on `/admin/reset-password`; entering the code + new password works. *(§E9)*
- [ ] **RC4 — Second admin login is blocked while one is active.** **Test:** log in as admin in Browser A; in Browser B, log in with the same admin account. **Expect:** Browser B is **held on a waiting screen** ("waiting for approval"); Browser A gets a **modal card** — *"Someone is trying to sign in"* showing the other email with **Allow them in** / **Keep my session**. On **Keep my session** (deny), B is told another admin is active and must try later; on **Allow**, A is signed out and B gets in. *(§E2)* **NOTE:** this is the richer Allow/Deny handoff you approved — not a plain "please log out" card. Flag if you'd prefer the simpler message.
- [ ] **RC5 — Rate-limit message states the wait time.** **Test:** spam a form (e.g. contact) past its limit. **Expect:** a red message *"You've been rate limited. Please wait about N minute(s) before trying again."* with a real **N**. *(§I)*
- [ ] **RC6 — Admin enquiry status updates cleanly.** **Test:** Admin → Enquiries → open one → change status → Update. **Expect:** a success popup *"Status updated to '…'."*, the page refreshes, and the badge/dropdown show the new value (persisted). *(§E6)*
- [ ] **RC7 — Booking status is automatic, never hand-editable.** **Test:** Admin → Bookings → open any booking. **Expect:** **no status dropdown**; the badge is derived — **"Paid"** only when a payment is confirmed/captured, otherwise **"Awaiting payment"**. A note states it can't be changed by hand. *(§E8 / §D4)*

---

## A. Public site & navigation

- [ ] **A1 — Home loads.** **Test:** visit the domain root. **Expect:** brief preloader → hero (slideshow/animated title + scroll cue) → "Cinematic chapters" destinations → **"Our Tour Packages" (3 cards on desktop)** → experience/features → "Begin Your Private Journey" CTA → footer. No layout overflow, no uncaught console errors.
- [ ] **A2 — Header navigation.** **Test:** click Home / About / Tours / Destinations / Contact Us; click the BB logo. **Expect:** each routes correctly (with locale prefix on non-English); logo returns home; active link is highlighted.
- [ ] **A3 — Nav auth link.** **Test:** while logged out, view the header. **Expect:** the nav leads with **"Sign in" → `/login`** (the register link lives on the login page). *(Note: the old guide said "Create account"; the current design leads with Sign in.)* While logged in, the header shows your first name → `/account` + a Sign out control.
- [ ] **A4 — Mobile menu.** **Test:** at phone width tap the hamburger. **Expect:** drawer slides in with nav; tapping a link or the backdrop closes it; `Esc` closes it.
- [ ] **A5 — Header scroll behaviour.** **Test:** scroll down then up on a long page. **Expect:** header gets a "scrolled" style after a small scroll; hides when scrolling down past the hero and re-appears when scrolling up. No flicker.
- [ ] **A6 — Language switcher (7 languages).** **Test:** open the globe/EN dropdown; switch to العربية / हिन्दी / ಕನ್ನಡ / తెలుగు / اردو / 中文. Also try keyboard (Arrow keys + Enter) and click-outside-to-close. **Expect:** content translates; URL gets the locale prefix (e.g. `/ar/tours`); **Arabic & Urdu render right-to-left (`dir="rtl"`)**, others LTR; locale-specific fonts load. (Machine translations — proof-read separately.)
- [ ] **A7 — Cookie banner.** **Test:** first visit → Accept or Decline. **Expect:** banner dismisses and does not reappear (persisted in `localStorage` as `bb-cookie-consent`).
- [ ] **A8 — Footer.** **Test:** scroll to the footer on any page. **Expect:** logo + blurb, social icons, Explore links, Destinations quick-links, Contact details, copyright. Links route correctly.
- [ ] **A9 — About / Tours / Destinations list pages.** **Test:** open `/about`, `/tours`, `/destinations`. **Expect:** page hero + breadcrumbs; Tours lists every **published** package (image, tier badge, title, summary, duration, price); Destinations lists every **published** destination; cards link to detail pages; mobile shows a horizontal/swipe layout where applicable.
- [ ] **A10 — Destination detail (`/[slug]`).** **Test:** open a destination (e.g. `/sigiriya`). **Expect:** hero + "Back to destinations", travel-notes editorial, key attraction, highlights, quick-facts sidebar, "Plan your route" CTA, related destinations, bottom CTA. Image renders (incl. admin-uploaded ones).
- [ ] **A11 — Package detail (`/booking/[slug]`).** **Test:** open a package from Tours. **Expect:** hero + "Back to tours", package panel (image/tier/summary/meta), **itinerary** day-by-day, "What's included", "What happens next", payment-summary card, related packages, and the **reserve area** (state depends on login/verification — see §D1). Image renders without error (incl. Supabase-hosted uploads).

---

## B. Lead forms (contact → reservations + admin)

- [ ] **B1 — Contact form `/contacts`.** **Test:** fill name, email (yours), phone, country, package (optional), message → submit. **Expect:** success note on the form; a row in **Admin → Enquiries** (+ dashboard "Recent enquiries"); a "New enquiry from …" email to `reservations@`; an acknowledgement email to the address you entered.
- [ ] **B2 — Custom quote `/custom-quote` (4-step wizard, ALL fields required).** **Test:** step through Package → Hotel → Air ticket → Transport → your details; try to **Next/submit with any empty or invalid field**; then complete everything and submit. **Expect:** you cannot advance past an incomplete step; **per-field red errors** name exactly what's wrong (required, date-in-past, departure-before-arrival, return-before-departure, return required for round trips); on a full valid submit → success note, a record in **Admin → Custom inquiries** (grouped details), a staff email to `reservations@`, an acknowledgement to the customer. *(SMS disabled by default → no text.)*
- [ ] **B3 — Field-level validation feedback.** **Test:** in both forms, trigger a single bad field (e.g. malformed email). **Expect:** the specific field is highlighted with a clear message; the form scrolls/focuses to the first error; fixing it clears the error.
- [ ] **B4 — Submit feedback / spinners.** **Test:** submit any public form. **Expect:** the button shows a spinner / busy state while submitting; on success a green success note/toast; on failure a red note. No double-submit.
- [ ] **B5 — Anti-spam: time-trap.** **Test:** submit a form **instantly** (under ~2.5s of the page loading). **Expect:** blocked with *"Please wait a moment before submitting."*
- [ ] **B6 — Anti-spam: honeypot.** **Test (dev tools):** fill the hidden `company` field and submit. **Expect:** silently rejected (bot trap; the field is visually hidden + `tabindex=-1`).
- [ ] **B7 — Anti-spam: rate limit.** **Test:** submit many times quickly. **Expect:** blocked with the **"wait about N minute(s)"** message (see §I for the per-form limits and keys).
- [ ] **B8 — Email deliverability guard.** **Test:** submit with a typo domain (`you@gmial.cm`) or a disposable inbox (`x@mailinator.com`) or a reserved domain (`x@test.com`). **Expect:** rejected before sending — typo: "We couldn't find a mail server for that email's domain…"; disposable: "Please use a permanent email address…"; reserved: "Please enter a real email address we can reach."

---

## C. Customer accounts

- [ ] **C1 — Registration `/register` (happy path).** **Test:** fill First/Last name, Email (yours), Phone, Date of birth, Country, City, Passport number + expiry, Password → Create account. **Expect:** redirected to `/account` showing **"awaiting verification"**; a new applicant appears in **Admin → Customers ("New applications")** with all details; a "being reviewed" email to the customer + a "new customer to verify" email to `reservations@`.
- [ ] **C2 — Registration edge cases.** **Test each:** future date of birth; expired passport; password < 8 chars; duplicate email. **Expect:** each is rejected with a specific message — *"Date of birth must be in the past."*, *"Passport expiry must be a future date."*, password length message, *"User already registered."* No partial account created.
- [ ] **C3 — Login `/login`.** **Test:** log in with the C1 account; try the **eye icon**; try a wrong password. **Expect:** correct creds → `/account` (or the `?next=` target); wrong → *"Invalid login credentials"*, stays on login; eye toggles visibility; "Forgot password?" and "Create an account" links work; a logged-in visitor opening `/login` is handled gracefully.
- [ ] **C4 — Forgot password `/forgot-password`.** **Test:** enter your email → receive a **6-digit code** → on `/reset-password` enter code + new password → log in with the new password. **Expect:** code email arrives (valid ~15 min); valid code + new password → "password updated" (`/login?reset=1`), login works; wrong/expired code is rejected with a clear message.
- [ ] **C5 — Account page `/account`.** **Test:** view it while logged in. **Expect:** greeting with your name, verification status, your bookings list, and a **"Change password"** card.
- [ ] **C6 — Change password from account (2-step).** **Test:** in the account card → enter current + new password → Continue → enter the emailed 6-digit code → submit. **Expect:** code emailed; on success the password changes (log out/in to confirm); wrong current password or wrong code is rejected.
- [ ] **C7 — Logout.** **Test:** sign out. **Expect:** session ends; protected pages (`/account`, `/booking` reserve area) bounce to `/login?next=…`.
- [ ] **C8 — Deactivated account.** **Test:** have an admin **Deactivate login** for your customer, then try to use the site. **Expect:** you can no longer sign in / your active session is dropped on the next request; re-activating restores access. *(§E11)*

---

## D. Booking & payment

- [ ] **D1 — Purchase gating (verified-only).** **Test:** open `/booking/<package>` while (a) logged out, (b) logged-in unverified, (c) verified-with-no-price. **Expect:** (a) "Sign in to reserve" + Create account/Sign in; (b) "account awaiting verification" notice (no form); (c) "no instant price — contact us" notice. **Unverified/guests cannot book.**
- [ ] **D2 — Verify the customer (admin).** **Test:** Admin → Customers → applicant → **"Verify (allow purchases)"**. **Expect:** they move to "Verified" and receive an "account is verified" email; they can now see the booking form.
- [ ] **D3 — Booking (verified customer).** **Test:** open `/booking/<slug>`, pick **start/end dates** (native pickers; end ≥ start, not in the past), travellers, notes → submit (wait ~3s first). **Expect:** a **booking row** is created (status `awaiting_payment`), a **payment** is initiated, and you're redirected to the **hosted checkout** (`/pay/<token>`) showing traveller + amount. The booking appears in **Admin → Bookings**.
- [ ] **D4 — Currency model (display USD, charge LKR).** **Test:** on the pay page note the displayed amount vs. what the gateway charges. **Expect:** packages **display USD**; the gateway is charged **LKR = USD × `USD_TO_LKR_RATE`** (default ×300), rounded to 2 dp. (e.g. USD 3999 → LKR 1,199,700.) Confirm `MPGS_CURRENCY=LKR`.
- [ ] **D5 — Payment (sandbox/live gateway).** **Test:** on the pay page complete the card payment via the MPGS hosted checkout (sandbox test card if in test mode). **Expect:** the hosted checkout loads (script from the MPGS origin); on success → a result page confirming payment; **booking status flips to Paid**; an **invoice email** to the customer **and** `reservations@`.
- [ ] **D6 — Paid status is automatic.** **Test:** after a confirmed payment, view Admin → Bookings. **Expect:** the booking shows **Paid** (derived from the captured payment) — there is no manual toggle.
- [ ] **D7 — Pay-link expiry.** **Test:** open a pay link older than `PAY_LINK_TTL_HOURS` (default 72h). **Expect:** shown as **expired**; the Pay button is hidden; no payment possible.
- [ ] **D8 — Payment edge cases.** **Test:** (a) double-click Pay; (b) reload the result page after capture; (c) POST to `/api/payments/create-session` from a different origin. **Expect:** (a) no duplicate sessions/charges; (b) idempotent — no duplicate invoice email; (c) cross-origin request is refused (same-origin guard). Create-session is also rate-limited (429 + `Retry-After`).
- [ ] **D9 — Webhook reconciliation.** **Test (technical):** simulate the MPGS webhook `POST /api/payments/webhook` with the `X-Notification-Secret` header. **Expect:** correct secret → reconciles the order (captures → booking Paid, sends invoice once); wrong/missing secret → rejected (constant-time check); re-delivery is idempotent.

---

## E. Admin panel

- [ ] **E1 — Admin login allowlist.** **Test:** log in with an allowlisted staff email; then try a non-allowlisted email that has valid Supabase creds. **Expect:** allowlisted → dashboard; non-allowlisted → rejected (*"This account is not authorized for admin access."*), never reaches `/admin`.
- [ ] **E2 — Single active admin (handoff).** **Test:** log in as admin in Browser A; log in again in Browser B. **Expect:** B → **waiting screen** (`/admin/login/waiting`, polling); A → **Allow/Deny modal** naming B's email. **Allow** → A is signed out (`/admin/login?kicked=1`) and B gets in; **Keep my session** (deny) → B is told another admin is active; **no response in ~2 min** → B sees a timeout message. An abandoned A seat frees after ~60s so B can claim it without contest.
- [ ] **E3 — Admin route gating.** **Test:** while logged out (or as a non-admin), hit `/admin`, `/admin/packages`, `/admin/users`, `/admin/bookings`. **Expect:** all redirect to `/admin/login`.
- [ ] **E4 — Dashboard.** **Test:** open `/admin`. **Expect:** a **Web analytics** panel (views/visitors for 24h/7d/30d, a 14-day trend chart, top pages — see §F), operational metrics (packages/destinations/enquiries/bookings counts), and recent enquiries/bookings (clickable rows).
- [ ] **E5 — Packages management.** **Test:** Admin → Packages → open one → edit a field / **upload an image** → save; create a new package; try to **delete a package that has bookings**; delete one with **no** bookings. **Expect:** changes persist and reflect on public `/tours` + `/booking/<slug>`; uploaded images render publicly; delete-with-bookings is **blocked** with a message; delete-without-bookings succeeds; new published packages auto-appear in the sitemap.
- [ ] **E6 — Destinations management.** **Test:** Admin → Destinations → create/edit (hero + card image) / delete. **Expect:** changes reflect on `/destinations` and the destination detail page; create page (`/admin/destinations/new`) loads and saves without error.
- [ ] **E7 — Enquiries + status change.** **Test:** Admin → Enquiries → open the B1 enquiry → change status (new/contacted/closed) → Update. **Expect:** it's listed; status update shows a **success popup** *"Status updated to '…'."*, the page refreshes, and the change **persists**.
- [ ] **E8 — Custom inquiries.** **Test:** Admin → Custom inquiries. **Expect:** the B2 inquiry is listed with grouped details (Package/Hotel/Air ticket/Transport), email, mobile, country/city, passport, date.
- [ ] **E9 — Bookings (read-only status).** **Test:** Admin → Bookings → open one. **Expect:** D3 bookings listed (reference, traveller, amount, status); detail shows traveller/email/phone/package/dates/amount + a **Payments** section. **Status is NOT editable** — derived **Paid** (confirmed payment) / **Awaiting payment** otherwise.
- [ ] **E10 — Customers: verify / deactivate / reactivate.** **Test:** verify an applicant (E/D2); **Deactivate login** on a customer then try to log in as them; Activate again. **Expect:** verify → can purchase + gets email; **deactivate → that customer can no longer log in (active session dropped)**; activate restores access.
- [ ] **E11 — Admin forgot/reset password (code only to reservations@).** **Test:** `/admin/login` → "Forgot password?" (no email field) → **Send reset code** → on `/admin/reset-password` enter the code + new password. **Expect:** the 6-digit code is sent **only to `reservations@beyondborders.lk`** (regardless of who clicks); reset works; sign in with the new password. Invalid/expired codes are rejected.
- [ ] **E12 — Admin change password (Settings, code only to reservations@).** **Test:** Admin → Settings → enter current + new password → Continue → enter the emailed code → "Verify and change". **Expect:** same 2-step wizard as the website; code goes **only to `reservations@`**; on success the password changes and **you stay logged in**; wrong current password or wrong code is rejected; "Resend code" works.
- [ ] **E13 — Admin responsiveness.** **Test:** open the admin on a phone. **Expect:** top bar with hamburger; sidebar opens as a drawer (backdrop + `Esc` close it); tables/cards reflow; no horizontal overflow.
- [ ] **E14 — View site / Sign out.** **Test:** use the sidebar "View site ↗" and "Sign out". **Expect:** "View site" opens `/` in a new tab; "Sign out" ends the admin session (local scope) → `/admin/login`, and protected pages bounce.
- [ ] **E15 — Admin error boundary & 404.** **Test:** trigger an admin error (e.g. duplicate slug) and open a non-existent detail page (`/admin/packages/<bad-id>`). **Expect:** a branded **"We hit a snag"** boundary (Try again / Back to dashboard) inside the shell — not the raw Next.js overlay; the in-shell admin 404 ("couldn't find that page") for missing records.

---

## F. First-party analytics

- [ ] **F1 — Pageview tracking → dashboard.** **Test:** in a normal browser (not admin, not a bot UA) browse a few public pages → wait a minute → reload the Admin dashboard. **Expect:** the Web analytics panel shows non-zero views/visitors, a populated 14-day chart, and top pages.
- [ ] **F2 — Exclusions.** **Test:** browse `/admin/*`; and (technical) send a `/api/track` beacon with a bot User-Agent. **Expect:** admin pages are **not** counted; bot UAs (`bot|crawl|spider|slurp|preview|monitor|headless|lighthouse`) are ignored; cross-origin/`/api`/`/admin` paths are rejected; no raw IP is stored (salted visitor hash only).
- [ ] **F3 — Vercel Analytics / Speed Insights.** **Test (on Vercel):** confirm the `/_vercel/insights/*` and `/_vercel/speed-insights/*` scripts load. **Expect:** they 200 on the live deployment (they 404 only on a local `next start` — that's normal).

---

## G. SEO & technical

- [ ] **G1 — robots.txt.** **Test:** visit `/robots.txt`. **Expect:** allows the site; disallows `/admin /api /account /pay /forgot-password /reset-password`; lists the sitemap; the host is **your live domain** (confirms `NEXT_PUBLIC_SITE_URL`).
- [ ] **G2 — sitemap.xml.** **Test:** visit `/sitemap.xml`. **Expect:** ~26 URLs (home, tours, destinations, about, contacts, custom-quote, every package, every destination) with **hreflang alternates for all 7 locales + x-default**, on your live domain. Then submit it in Google Search Console.
- [ ] **G3 — Social preview (OG/Twitter).** **Test:** paste a page URL into a link-preview tester (or share on WhatsApp/Slack). **Expect:** title, description, and the Beyond Borders image; `twitter:card = summary_large_image`; absolute URLs (metadataBase).
- [ ] **G4 — Security headers.** **Test:** inspect response headers. **Expect:** `Content-Security-Policy` (locked default-src; script/connect allow only Supabase + MPGS + Vercel; `frame-ancestors 'none'`; `img-src … https:`), `Strict-Transport-Security` (HSTS, 2-yr, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- [ ] **G5 — HTTPS & SSL.** **Test:** confirm the padlock / valid certificate on the live domain.
- [ ] **G6 — Responsiveness.** **Test:** spot-check home / tours / booking / login / register / admin at ~375px, ~768px, ~1280px. **Expect:** no horizontal scrollbar, readable text, tappable buttons.
- [ ] **G7 — 404 pages.** **Test:** visit a nonsense URL (`/xyz`), an unknown in-locale slug (`/en/not-a-place`), and a bad admin path. **Expect:** branded global 404; localized in-shell 404 with header/footer; in-shell admin 404 — each with a way back.
- [ ] **G8 — Images / next-image.** **Test:** view pages with admin-uploaded images (Supabase Storage URLs). **Expect:** images render through the optimizer (no "hostname not configured" crash); empty/missing images fall back gracefully (no broken layout).

---

## H. Email & notifications

- [ ] **H1 — Enquiry emails.** **Test:** submit the contact form. **Expect:** customer ack ("We received your Beyond Borders enquiry") + staff notification ("New enquiry from …") to `reservations@`; one failed recipient never blocks the other (best-effort).
- [ ] **H2 — Custom inquiry emails.** **Test:** submit the custom quote. **Expect:** customer ack + staff notification (details grouped by section) to `reservations@`/`SMTP_USER` (de-duplicated).
- [ ] **H3 — Registration emails.** **Test:** register. **Expect:** "account is being reviewed" to the customer + "new customer to verify" to `reservations@`.
- [ ] **H4 — Password-reset code emails.** **Test:** trigger customer forgot, admin forgot, and both change-password flows. **Expect:** a 6-digit code email; **admin codes go only to `reservations@`**; codes expire ~15 min.
- [ ] **H5 — Account-verified email.** **Test:** admin verifies a customer. **Expect:** an "account is verified" email to the customer.
- [ ] **H6 — Invoice email.** **Test:** complete a payment. **Expect:** an invoice (traveller, reference, package, amount, transaction id) to the customer **and** `reservations@`.
- [ ] **H7 — Reserved-domain suppression.** **Test (technical):** any flow that would email an `@*.test` / `@example.com` address. **Expect:** the send is **skipped** (logged `[email skipped: non-deliverable recipient]`) so test data never bounces back into the inbox.
- [ ] **H8 — SMTP toggle.** **Test (technical):** with `SMTP_USER`/`SMTP_PASSWORD` blank. **Expect:** all sends are cleanly skipped (`[email skipped]`); no errors, flows still succeed.
- [ ] **H9 — SMS notifications (if enabled).** **Test:** with `SMS_ENABLED=true` + creds, submit a custom inquiry and complete a payment. **Expect:** a business SMS to `SMS_TEAM_CONTACT` (inquiry-received / payment-received, Colombo time). With `SMS_ENABLED=false` (default) → no SMS, no errors. SMS failures never block the user flow.

---

## I. Rate limiting & anti-abuse

- [ ] **I1 — Per-form limits surface the wait time.** **Test:** exceed each form's limit. **Expect:** *"You've been rate limited. Please wait about N minute(s)…"* with a real N. Limits: **contact 5/60min (per IP)**, **booking 10/60min (per IP)**, **custom inquiry 8/60min (per IP+email)**, **login/register/account/admin (per IP+email)**, **payment create-session (per IP, 429 + `Retry-After`)**.
- [ ] **I2 — Shared-network fairness.** **Test:** two different people (different emails) on the same Wi-Fi submit the custom inquiry / register concurrently. **Expect:** they do **not** block each other (those limits are keyed per IP+email via `scopedRateKey`). *(Contact/booking are intentionally per-IP volume caps.)*
- [ ] **I3 — Fail-open.** **Test (technical):** if the limiter backend is unavailable. **Expect:** requests are allowed (never lock real users out); to manually clear a lockout, truncate `rate_limit_events`.
- [ ] **I4 — Time-trap + honeypot.** Covered in §B5/§B6 — both also gate spam.

---

## J. Localization & RTL (per-locale)

- [ ] **J1 — Locale routing.** **Test:** visit `/ar/tours`, `/hi/destinations`, `/zh`, etc. **Expect:** `<html lang>` matches; English is unprefixed; others are prefixed; switching language preserves the page.
- [ ] **J2 — RTL.** **Test:** `ar` and `ur`. **Expect:** `dir="rtl"`; layout mirrors correctly (nav, cards, forms, buttons); no clipped/overlapping text.
- [ ] **J3 — Translation coverage.** **Test:** skim each locale's key pages + forms. **Expect:** UI strings are translated (machine translation — flag anything obviously wrong, untranslated, or overflowing). Rate-limit / validation / server messages appear in the chosen language where applicable.
- [ ] **J4 — Locale fonts.** **Test:** Arabic/Devanagari/Kannada/Telugu/Chinese pages. **Expect:** the correct script font loads (no tofu/boxes).

---

## K. Security & infrastructure (deeper)

- [ ] **K1 — CSP enforcement.** **Test:** in the console, confirm no CSP violations during normal use **and** that the MPGS hosted checkout + Supabase calls are allowed. **Expect:** third-party scripts outside the allowlist are blocked; payment + DB still work.
- [ ] **K2 — Clickjacking / framing.** **Test:** try to embed a page in an `<iframe>` on another origin. **Expect:** blocked (`X-Frame-Options: DENY` / `frame-ancestors 'none'`).
- [ ] **K3 — Protected areas not indexed/leaked.** **Test:** confirm `/admin`, `/account`, `/pay`, `/api` are disallowed in robots and require auth. **Expect:** no protected content is reachable unauthenticated or indexable.
- [ ] **K4 — Image upload constraints.** **Test:** in admin, upload a non-image / >5MB file. **Expect:** rejected with a clear message ("Unsupported image type…" / "Image is too large… 5MB"); only JPEG/PNG/WEBP/AVIF accepted; stored in the Supabase `media` bucket.
- [ ] **K5 — Customer-verification model.** **Test:** confirm new accounts start unverified and require admin approval; Supabase email-confirmation stays **OFF** (turning it on breaks registration).
- [ ] **K6 — Env / config sanity (go-live).** **Test:** confirm on the live deployment: `ADMIN_ALLOWED_EMAILS=reservations@beyondborders.lk`, `NEXT_PUBLIC_SITE_URL=https://www.beyondborders.lk`, live MPGS creds + `USD_TO_LKR_RATE`, SMTP creds present, DNS/MX for the domain intact (mail deliverable).

---

## L. Performance & resilience

- [ ] **L1 — Page performance.** **Test:** Lighthouse / Web Vitals on home + tours. **Expect:** reasonable LCP/CLS; images sized (no layout shift); modern formats (AVIF/WebP) negotiated.
- [ ] **L2 — Load / concurrency.** **Test:** run `node scripts/loadtest.mjs 100 30` against a running build (or a higher target). **Expect:** 100 concurrent users → ~100% success, no 5xx/crashes; latency degrades gracefully under saturation.
- [ ] **L3 — Cold/empty states.** **Test:** pages with no data (e.g. analytics before data, empty lists). **Expect:** graceful empty states, no crashes (analytics fails soft to "not collecting yet").

---

## M. Automated test suite (run alongside)

- [ ] **M1 — Unit/component.** `npm run test` (or `npx vitest run`) → all green (~108 tests).
- [ ] **M2 — E2E.** Start the app, then `npm run test:e2e` (Playwright) → all green (~75 tests): smoke, SEO, security-headers, auth, admin.authed, account.authed, booking.authed, responsive, custom-quote, tours, accessibility, performance.
- [ ] **M3 — Types/lint/build.** `npx tsc --noEmit`, `npx eslint .`, `npm run build` → all clean.

---

### Sign-off

- [ ] All **Recent changes (§1)** re-tested and confirmed.
- [ ] All sections A–M reviewed; failures logged with steps + screenshots.
- [ ] Go-live blockers cleared: one real sandbox→capture payment confirmed (currency/amount), live env vars set (§K6), emails delivering.

_Last updated: 2026-06-27 · derived from the codebase + the original UAT guide (A–G)._
