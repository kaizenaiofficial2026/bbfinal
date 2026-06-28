# Beyond Borders — Full QA & Acceptance Checklist

> **Supersedes** `Beyond-Borders-QA-Testing-Guide.pdf` (the original 40 checks A–G are all retained below, expanded, with new sections H–O added for everything built since).
> Work top to bottom and tick each box. Every check lists **Test** (how) and **Expect** (outcome).
> Verified against the codebase on the date below — file references in *italics* point to the source of truth.

---

## 0. Before you start

- **Environment:** can be run against the **live site** (`https://www.beyondborders.lk`) or a **local production build** (`npm run build && npm run start`) on the test Supabase.
- **Emails are real on live.** Every customer-side test sends a real acknowledgement to the address you use **plus** a copy to `reservations@beyondborders.lk`. To test with zero email noise, blank `SMTP_USER`/`SMTP_PASSWORD` (sends are skipped) or use the test build. Addresses on reserved domains (`@*.test`, `@example.com`, …) are auto-skipped — see §H7.
- **Admin account:** an email in `ADMIN_ALLOWED_EMAILS` (currently `reservations@beyondborders.lk`) + its password. Only ONE admin can hold the panel at a time (see §E2).
- **Payments:** the gateway is in **sandbox** (`MPGS_BASE_URL = test-seylan.mtf…`). Do the first real end-to-end payment in test mode and confirm the **charged currency/amount** before going live.
- **Automated coverage:** `npm run test:all` (typecheck → lint → Vitest + coverage → integration → security audit → Playwright e2e). Current suite size: **~128 unit/component tests** (16 unit + 9 component files) and **44 e2e tests across 13 spec files**. This document is the **manual UAT + full feature map**.
- **Locales:** 7 — `en` (no prefix), `ar`, `hi`, `kn`, `te`, `ur`, `zh`. `ar` + `ur` render right-to-left. `localePrefix` is **`as-needed`** (English is unprefixed; every other locale is prefixed).

---

## 1. ⭐ Recent changes — focused re-test

The items most recently changed. (Each is also covered in its full section below.)

- [ ] **RC1 — Custom inquiry: 3 OPTIONAL service sections (pick 1–3), all-or-nothing when started.** **Test:** open `/custom-quote`. The wizard now has **3 service steps — Hotel, Air ticket, Transport — and NO "Package/Tours" step**. Fill **only** Hotel and click **Submit inquiry** (skipping Air ticket & Transport): it submits. Then try a section where you fill *some* but not *all* of its fields: that section blocks with per-field errors. Try to submit with **no** section filled: blocked with *"Please fill in at least one service (hotel, air ticket or transport)."* **Expect:** minimum 1 section, maximum all 3; a started section must be completed in full; the always-visible **"Your details"** guest block (name, country & city, passport, email, mobile) is **always required**; both **Next** and **Submit inquiry** buttons are present and you can submit from any step. *(§B2)* **NOTE:** this replaces the old "4-step, every field required" behaviour described in earlier guides.
- [ ] **RC2 — Air ticket builder (Skyscanner-style).** **Test:** on the Air ticket step, switch trip type **One way / Round trip / Multi-city**; pick origin/destination via the airport+country search; confirm the destination defaults to **Colombo (CMB)**; on Round trip a two-way arrow + a return date appear; on Multi-city add up to **6** legs (chain style); pick an **airline** (searchable), set **passengers + cabin class** (popover with steppers), set **extra baggage**. **Expect:** all of it serialises into the inquiry; the swap button flips origin/destination. *(§B2a)*
- [ ] **RC3 — Register: Country before Mobile, auto dial code, searchable Country/City, confirm-password.** **Test:** on `/register`, pick a **Country** (searchable, with flag) — the **Mobile** field auto-prefixes that country's dialling code; the **City** field then offers cities of that country; enter and **confirm** the new password and toggle the eye/reveal. **Expect:** Country comes before Mobile; a mismatched confirm shows *"Passwords do not match."* *(§C1)*
- [ ] **RC4 — Pay page: agree to Terms before paying.** **Test:** open `/pay/<token>`; the **Pay** button is **disabled** until you tick *"I agree to the Terms & Conditions"* (which links to `/terms`). **Expect:** ticking it enables the button; the link opens the Terms page. *(§D8 / §O)*
- [ ] **RC5 — Nav label/order: "Inquiries".** **Test:** view the header. **Expect:** order is **Home · Tours · Destinations · Inquiries · About · Contact Us**. "Inquiries" is the renamed Custom-quote link and still routes to `/custom-quote`. *(§A2)*
- [ ] **RC6 — Admin idle-timeout message is accurate.** **Test:** sign in to admin, leave it idle until the seat lapses (~60s of no heartbeat). **Expect:** you're returned to `/admin/login` with *"Your session ended after a period of inactivity…"* — **NOT** the old misleading "another admin logged in" text. A genuine takeover (another admin allowed in) still shows *"Another admin signed in and took over the panel…"*. *(§E2)*
- [ ] **RC7 — Second admin login → Allow/Deny handoff.** **Test:** sign in as admin in Browser A; sign in again in Browser B. **Expect:** B → **waiting screen** (`/admin/login/waiting`, polling ~2.5s); A → **modal** naming B's email with **Allow them in** / **Keep my session**. Allow → A is signed out (`/admin/login?kicked=1`) and B gets in; Keep my session (deny) → B is told another admin is active; ~2 min of no response → B times out. *(§E2)*
- [ ] **RC8 — Rate-limit message states the wait time.** **Test:** spam a public form past its limit. **Expect:** *"You've been rate limited. Please wait about N minute(s) before trying again."* with a real **N**. *(§I)*
- [ ] **RC9 — Admin enquiry status updates cleanly.** **Test:** Admin → Enquiries → open one → change status → Update. **Expect:** a success toast *"Status updated to '…'."*, the page refreshes, the new value persists. *(§E7)*
- [ ] **RC10 — Booking status is automatic, never hand-editable.** **Test:** Admin → Bookings → open any booking. **Expect:** **no status dropdown**; the badge is derived — **"Paid"** only when a payment is confirmed/captured, otherwise **"Awaiting payment"**; a note says it can't be changed by hand. *(§E9 / §D6)*
- [ ] **RC11 — Admin password (forgot + change): code only to `reservations@`.** **Test:** admin "Forgot password?" (no email field) and Settings → change password. **Expect:** the 6-digit code is always sent to `reservations@beyondborders.lk`, never to the person resetting. *(§E11/§E12)*

---

## A. Public site & navigation

- [ ] **A1 — Home loads.** **Test:** visit the domain root. **Expect:** brief preloader → **Hero** (animated title/subtitle + scroll cue) → **"Cinematic chapters of Sri Lanka"** destinations → **"Our Tour Packages" (3 cards on desktop)** → **Experience** section → **"Begin Your Private Journey"** CTA → footer. No layout overflow, no uncaught console errors. *(There is no separate "features" block on the home page — the numbered features grid lives on `/about`.)*
- [ ] **A2 — Header navigation.** **Test:** click each nav item; click the BB logo. **Expect:** the order is **Home · Tours · Destinations · Inquiries · About · Contact Us**. *("Inquiries" is the renamed `customQuote` link and routes to `/custom-quote`; "Contact Us" is appended after the mapped links and routes to `/contacts`.)* Each routes correctly (with locale prefix on non-English); the **logo returns home** (`/#hero`); the active link is highlighted (`startsWith` match → `nav-active` + `aria-current`).
- [ ] **A3 — Nav auth link.** **Test:** while logged out, view the header. **Expect:** it leads with **"Sign in" → `/login`** (the register link lives on the login page). While logged in, the header shows **"Hi, {firstName}" → `/account`** + a **Sign out** control.
- [ ] **A4 — Mobile menu.** **Test:** at phone width tap the hamburger. **Expect:** the drawer slides in with the nav; tapping a **link** or the **backdrop** closes it. *(Note: the mobile drawer does NOT close on `Esc` — only the language switcher closes on `Esc`. If you want `Esc` to close the nav drawer too, flag it.)*
- [ ] **A5 — Header scroll behaviour.** **Test:** scroll down then up on a long page. **Expect:** header gets an `is-scrolled` style after ~24px; **hides** when scrolling down past ~520px and **re-appears** when scrolling up. No flicker.
- [ ] **A6 — Language switcher (7 languages).** **Test:** open the globe/EN dropdown; switch to العربية / हिन्दी / ಕನ್ನಡ / తెలుగు / اردو / 中文. Try keyboard (Arrow/Enter/Home/End/Esc) and click-outside-to-close. **Expect:** content translates; the URL gets the locale prefix (e.g. `/ar/tours`); **Arabic & Urdu render right-to-left (`dir="rtl"`)**, others LTR; locale-specific fonts load. (Machine translations — proof-read separately.)
- [ ] **A7 — Cookie banner.** **Test:** first visit → Accept or Decline. **Expect:** the banner dismisses and does not reappear (persisted in `localStorage` as `bb-cookie-consent` = `"accepted"`/`"declined"`). It only appears after the preloader clears.
- [ ] **A8 — Footer.** **Test:** scroll to the footer on any page. **Expect:**
  - Logo + blurb, three social icons (Facebook/Instagram/LinkedIn) — **currently `href="#"` placeholders** (wire up real URLs before go-live).
  - **Explore** links: **Home · About · Tours · Destinations · Contact Us** (note: no "Inquiries" link here, and the order differs from the header).
  - **Destinations** quick-links: **Sigiriya · Kandy · Galle · Yala · Polonnaruwa** (hardcoded `/[slug]`, English labels).
  - **Contact:** `reservations@beyondborders.lk`, `+94 11 242 5087`, `+94 76 097 9222`, "Colombo 03, Sri Lanka".
  - Copyright "© 2026 Beyond Borders. All rights reserved." + tagline.
- [ ] **A9 — About / Tours / Destinations list pages.** **Test:** open `/about`, `/tours`, `/destinations`. **Expect:** page hero + breadcrumbs; **Tours** lists every **published** package — each card shows image, title, summary, a meta row of **duration · tier · hotels · destinations**, and price, and the list **appends a "Plan a custom quote" CTA card** linking to `/custom-quote`; **Destinations** lists every **published** destination; cards link to detail pages; mobile shows a horizontal/swipe layout where applicable.
- [ ] **A10 — Destination detail (`/[slug]`).** **Test:** open a destination (e.g. `/sigiriya`). **Expect:** hero + "Back to destinations", travel-notes editorial, key attraction, highlights, quick-facts sidebar, "Plan your route" CTA, related destinations, bottom CTA. Image renders (incl. admin-uploaded). *(This is the root catch-all slug route; destinations are unprefixed under the locale.)*
- [ ] **A11 — Package detail (`/booking/[slug]`).** **Test:** open a package from Tours. **Expect:** hero + "Back to tours", package panel (image/tier/summary/meta), **itinerary** day-by-day, "What's included", "What happens next", payment-summary card, related packages, and the **reserve area** whose state depends on login/verification/price (see §D1).
- [ ] **A12 — Terms & Conditions page (`/terms`).** **Test:** open `/terms` (also reachable from the pay-page agreement link). **Expect:** a "Terms & Conditions" hero + the legal clauses (non-refundable payments, credit-card/passport copies, cross-check on arrival, credit-card-fraud guideline with the `info@beyondborders.lk` mailto, right to amend) and a note to tick the box on the payment page. English-only by design. *(§O)*

---

## B. Lead forms (contact → reservations + admin)

- [ ] **B1 — Contact form `/contacts`.** **Test:** fill name, email (yours), phone, country, package (optional), message → submit. **Expect:** success note on the form ("Thanks, {name}…"); a row in **Admin → Enquiries** (+ dashboard "Recent enquiries"); a "New enquiry from …" email to `reservations@`; an acknowledgement email to the address you entered. **NOTE:** the **country** field is shown but is **not stored or emailed** (it's echoed back only); the **message** requires ~10+ characters; the **phone** is visually required but optional server-side. If country should be captured, that's a gap to fix.
- [ ] **B2 — Custom inquiry `/custom-quote` (3 OPTIONAL sections + guest details).** **Test:** step through **Hotel → Air ticket → Transport**; pick **any 1–3** sections; for each section you start, leave one field blank and try to advance/submit; then complete your chosen section(s) and the **Your details** block and submit. **Expect:**
  - You can **Submit inquiry from any step** (both Next and Submit are present).
  - **At least one** section must be completed; **0 sections → blocked** with *"Please fill in at least one service…"*.
  - A **started** section is **all-or-nothing**: per-field red errors name exactly what's wrong (required, date-in-past, departure-before-arrival, return-before-departure, return required for round trips, origin≠destination); the wizard scrolls to the first error.
  - The always-visible **Your details** block (first/last name, **country & city**, passport number, email, mobile) is **always validated**.
  - On a valid submit → success note, a record in **Admin → Custom inquiries** (grouped by Hotel/Air ticket/Transport), a staff email to `reservations@`, an acknowledgement to the customer. *(SMS off by default → no text — see §H9.)*
- [ ] **B2a — Air ticket builder.** **Test (inside B2's Air ticket step):** toggle **One way / Round trip / Multi-city**; search origin & destination (airports **and** countries via `/api/places`); confirm destination defaults to **Colombo (CMB)**; on **Round trip** see the two-way arrow + a return-date field; on **Multi-city** add legs (chain style, up to **6**); use the **swap** button; pick an **airline** (searchable, IATA-coded); open the **passengers/cabin-class** popover (adults/children steppers, Economy/Premium/Business/First, Apply); set **extra baggage** Yes/No. **Expect:** all values serialise into the inquiry; multi-city requires ≥2 legs; round trip requires a return date ≥ departure.
- [ ] **B3 — Field-level validation feedback.** **Test:** in both forms, trigger a single bad field (e.g. malformed email). **Expect:** the specific field is highlighted with a clear message; the form **scrolls/centres the first error** into view; fixing it clears the error. *(Errors use `role="alert"`; the server returns every invalid field, not just the first.)*
- [ ] **B4 — Submit feedback / spinners.** **Test:** submit any public form. **Expect:** the button shows a spinner / "Sending…" busy state (`aria-busy`) while submitting; on success a green note; on failure a red note. No double-submit (button disabled while pending).
- [ ] **B5 — Anti-spam: time-trap.** **Test:** submit a form **instantly** (under **2.5s** of page load). **Expect:** blocked with *"Please wait a moment before submitting."* *(Threshold is 2500ms across contact, booking, and custom-quote.)*
- [ ] **B6 — Anti-spam: honeypot.** **Test (dev tools):** fill the hidden `company` field and submit. **Expect:** silently rejected (the field is visually hidden, `tabindex=-1`, `autocomplete=off`; schema enforces `company` length 0).
- [ ] **B7 — Anti-spam: rate limit.** **Test:** submit many times quickly. **Expect:** blocked with the **"wait about N minute(s)"** message (see §I for exact per-form limits/keys). *(The payment endpoint uses its own copy + a `Retry-After` header — see §D8.)*
- [ ] **B8 — Email deliverability guard.** **Test:** submit with a typo domain (`you@gmial.cm`), a disposable inbox (`x@mailinator.com`), or a reserved domain (`x@test.com`). **Expect:** rejected before sending — typo: *"We couldn't find a mail server for that email's domain…"*; disposable: *"Please use a permanent email address…"*; reserved: *"Please enter a real email address we can reach."* *(MX-checked; **fails open** on transient DNS errors. On the custom inquiry the error attaches to the email field specifically.)*

---

## C. Customer accounts

- [ ] **C1 — Registration `/register` (happy path).** **Test:** fill First/Last name, Email, **Country** (searchable, flags), **City** (searchable, scoped to the country), **Mobile** (dial code auto-filled from the country), Date of birth, Passport number + expiry, Password + **Confirm password** (eye toggle) → Create account. **Expect:** **Country comes before Mobile** and selecting it auto-prefixes the dialling code; City offers cities of the chosen country (`/api/cities`); a mismatched confirm shows *"Passwords do not match."*; on success → `/account` showing **"awaiting verification"**; a new applicant appears in **Admin → Customers ("New applications")** with all details; a "being reviewed" email to the customer + a "new customer to verify" email to `reservations@`. *(New accounts are created `verified=false`.)*
- [ ] **C2 — Registration edge cases.** **Test each:** future date of birth; expired passport; password < 8 chars; mismatched confirm password; duplicate email. **Expect:** each is rejected with a specific message — *"Date of birth must be in the past."*, *"Passport expiry must be a future date."*, *"Password must be at least 8 characters."*, *"Passwords do not match."*, *"User already registered."* No partial account created.
- [ ] **C3 — Login `/login`.** **Test:** log in with the C1 account; try the **eye icon**; try a wrong password. **Expect:** correct creds → `/account` (or the `?next=` target); wrong → *"Invalid login credentials"*, stays on login; eye toggles visibility; "Forgot password?" → `/forgot-password` and "Create an account" → `/register` work; a logged-in visitor opening `/login` is handled gracefully.
- [ ] **C4 — Forgot password `/forgot-password`.** **Test:** enter your email → receive a **6-digit code** → on `/reset-password` enter code + new password → log in with the new password. **Expect:** code email arrives (valid **~15 min**, `OTP_TTL_MINUTES=15`); valid code + new password → "password updated" (`/login?reset=1`), login works; wrong/expired code is rejected with a clear message.
- [ ] **C5 — Account page `/account`.** **Test:** view it while logged in. **Expect:** greeting with your name, a verification status pill (verified / awaiting), your bookings list (with continue-to-pay links where applicable), and a **"Change password"** (Security) card.
- [ ] **C6 — Change password from account (2-step).** **Test:** in the account card → enter current + new password → Continue → enter the emailed 6-digit code → submit. **Expect:** current password is re-checked; code emailed; on success the password changes and you're re-signed-in (log out/in to confirm); wrong current password or wrong code is rejected.
- [ ] **C7 — Logout.** **Test:** sign out. **Expect:** session ends; protected pages (`/account`, `/booking` reserve area) bounce to `/login?next=…`.
- [ ] **C8 — Deactivated account.** **Test:** have an admin **Deactivate login** for your customer, then try to use the site. **Expect:** sign-in is refused with a "deactivated" message **and** an already-logged-in session is dropped on the next gated request (enforcement is at the auth boundary, not an instant socket kill); re-activating restores access. *(§E10)*

---

## D. Booking & payment

- [ ] **D1 — Purchase gating (verified-only).** **Test:** open `/booking/<package>` while (a) logged out, (b) logged-in unverified, (c) verified-with-no-price. **Expect:** (a) "Sign in to reserve" + Create account/Sign in (no form); (b) "account awaiting verification" notice (no form); (c) "no instant price — contact us" notice (no form). **Unverified/guests cannot book.**
- [ ] **D2 — Verify the customer (admin).** **Test:** Admin → Customers → applicant → **"Verify (allow purchases)"**. **Expect:** they move to "Verified" (with `verified_at`) and receive an "account is verified" email; they can now see the booking form.
- [ ] **D3 — Booking (verified customer).** **Test:** open `/booking/<slug>`, pick **start/end dates** (native pickers; end ≥ start, not in the past), travellers, notes → submit (wait **~2.5s** first — the time-trap). **Expect:** a **booking row** is created (status `awaiting_payment`), a **payment** is initiated (status `initiated`), and you're redirected to the **hosted checkout** (`/pay/<token>`) showing traveller + amount. The booking appears in **Admin → Bookings**.
- [ ] **D4 — Currency model (display USD, charge LKR).** **Test:** on the pay page note the displayed amount vs. what the gateway charges. **Expect:** packages **display USD**; the gateway is charged **LKR = USD × `USD_TO_LKR_RATE`** (default **×300**), rounded to 2 dp (e.g. USD 3999 → LKR 1,199,700). The USD price stays on the booking; the LKR amount is stored on the payment. Confirm `MPGS_CURRENCY=LKR` (default).
- [ ] **D5 — Payment (sandbox/live gateway).** **Test:** on the pay page complete the card payment via the MPGS hosted checkout (sandbox test card in test mode). **Expect:** the hosted checkout loads (`checkout.min.js` from the MPGS origin); return → `/pay/<token>/result`; on success → result page confirms payment; **booking status flips to Paid**; an **invoice email** to the customer **and** `reservations@`.
- [ ] **D6 — Paid status is automatic.** **Test:** after a confirmed payment, view Admin → Bookings. **Expect:** the booking shows **Paid**, derived from the captured payment (`reconcilePayment`) — there is no manual toggle anywhere.
- [ ] **D7 — Pay-link expiry.** **Test:** open a pay link older than **`PAY_LINK_TTL_HOURS`** (default **72h**). **Expect:** shown as **expired**; the Pay button is hidden; no payment possible.
- [ ] **D8 — Payment edge cases & T&C gate.** **Test:** (a) the **Pay** button is disabled until you tick **"I agree to the Terms & Conditions"** (links to `/terms`); (b) double-click Pay; (c) reload the result page after capture; (d) POST to `/api/payments/create-session` from a different origin. **Expect:** (a) ticking enables Pay; (b) no duplicate sessions/charges (button disabled while pending/until agreed); (c) idempotent — no duplicate invoice email (`reconcilePayment` early-returns on captured); (d) cross-origin request is refused with 403 (same-origin guard). Create-session is also rate-limited (**20 / 10 min per IP**, 429 + `Retry-After`).
- [ ] **D9 — Webhook reconciliation.** **Test (technical):** simulate the MPGS webhook `POST /api/payments/webhook` with the `X-Notification-Secret` header. **Expect:** correct secret → reconciles the order (captures → booking Paid, sends invoice once); wrong/missing secret → rejected (**constant-time** check, fails closed); re-delivery is idempotent.

---

## E. Admin panel

- [ ] **E1 — Admin login allowlist.** **Test:** log in with an allowlisted staff email; then try a non-allowlisted email that has valid Supabase creds. **Expect:** allowlisted → dashboard; non-allowlisted → signed back out + *"This account is not authorized for admin access."*, never reaches `/admin`. *(Allowlist = `ADMIN_ALLOWED_EMAILS`.)*
- [ ] **E2 — Single active admin (handoff).** **Test:** log in as admin in Browser A; log in again in Browser B. **Expect:** B → **waiting screen** (`/admin/login/waiting?req=…`, polling ~2.5s); A → **Allow/Deny modal** naming B's email. **Allow** → A is signed out (`/admin/login?kicked=1`) and B gets in; **Keep my session** (deny) → B is told another admin is active; **no response in ~2 min** → B times out. An **abandoned A seat frees after ~60s** so B can claim it without contest. **Idle-timeout message is accurate:** losing the seat to inactivity shows *"Your session ended after a period of inactivity…"*, while a real takeover shows *"Another admin signed in and took over the panel…"*. *(Lease values: active seat `ACTIVE_TTL_MS = 60s`; pending request `REQUEST_TTL_MS = 120s`.)*
- [ ] **E3 — Admin route gating.** **Test:** while logged out (or as a non-admin), hit `/admin`, `/admin/packages`, `/admin/users`, `/admin/bookings`. **Expect:** all redirect to `/admin/login`. *(No global middleware — every admin page calls `requireAdmin()` server-side.)*
- [ ] **E4 — Dashboard.** **Test:** open `/admin`. **Expect:** a **Web analytics** panel (views/visitors for 24h/7d/30d, a 14-day trend chart, top pages — see §F), operational metrics (Packages/Destinations/New enquiries/Bookings counts), and Recent enquiries/Recent bookings (clickable rows, top 5 each).
- [ ] **E5 — Packages management.** **Test:** Admin → Packages → open one → edit a field / **upload an image** → save; create a new package; try to **delete a package that has bookings**; delete one with **no** bookings. **Expect:** changes persist and reflect on public `/tours` + `/booking/<slug>` (and `/`); uploaded images render publicly; **delete-with-bookings is blocked** with *"This package has N booking(s) and can't be deleted. Set its status to Draft…"*; delete-without-bookings succeeds; only **published** packages appear in the sitemap.
- [ ] **E6 — Destinations management.** **Test:** Admin → Destinations → create/edit (hero + card image) / delete. **Expect:** changes reflect on `/destinations` and the destination detail page; `/admin/destinations/new` loads and saves without error.
- [ ] **E7 — Enquiries + status change.** **Test:** Admin → Enquiries → open the B1 enquiry → change status (new/contacted/closed) → Update. **Expect:** a **success toast** *"Status updated to '…'."*, the page refreshes (`router.refresh()`), and the change **persists**.
- [ ] **E8 — Custom inquiries.** **Test:** Admin → Custom inquiries. **Expect:** the B2 inquiry is listed with details **grouped dynamically by section — Hotel / Air ticket / Transport** (whatever the customer filled), plus email, mobile, country/city, passport, date. *(The list renders from the stored `details` keys; a legacy "Package" label remains in code only as a fallback for old records — the current form never produces a Package section.)*
- [ ] **E9 — Bookings (read-only status).** **Test:** Admin → Bookings → open one. **Expect:** the **list** shows **Reference / Traveller / Status** (the **amount is on the detail page**, not the list); the **detail** shows traveller/email/phone/package/dates/quoted amount + a **Payments** section. **Status is NOT editable** — derived **Paid** (confirmed payment) / **Awaiting payment** otherwise, with copy stating it's set automatically.
- [ ] **E10 — Customers: verify / deactivate / reactivate.** **Test:** verify an applicant (E/D2); **Deactivate login** on a customer then try to log in as them; Activate again. **Expect:** verify → can purchase + gets email; **deactivate → that customer can no longer log in and is dropped on the next gated request**; activate restores access.
- [ ] **E11 — Admin forgot/reset password (code only to reservations@).** **Test:** `/admin/login` → "Forgot password?" (**no email field**) → **Send reset code** → on `/admin/reset-password` enter the code + new password. **Expect:** the 6-digit code is sent **only to `reservations@beyondborders.lk`** (the `ADMIN_SECURITY_INBOX`, audience `admin`) regardless of who clicks; reset works; sign in with the new password. Invalid/expired codes are rejected.
- [ ] **E12 — Admin change password (Settings, code only to reservations@).** **Test:** Admin → Settings → enter current + new password → Continue → enter the emailed code → "Verify and change". **Expect:** same 2-step wizard as the website; code goes **only to `reservations@`**; on success the password changes and **you stay logged in** (re-signed-in); wrong current password or wrong code is rejected; "Resend code" works.
- [ ] **E13 — Admin responsiveness.** **Test:** open the admin on a phone. **Expect:** top bar with hamburger; sidebar opens as a drawer (backdrop + `Esc` close it; `aria-expanded`/`aria-controls` wired); tables/cards reflow; no horizontal overflow.
- [ ] **E14 — View site / Sign out.** **Test:** use the sidebar "View site ↗" and "Sign out". **Expect:** "View site" opens `/` in a new tab (`rel="noopener noreferrer"`); "Sign out" ends the admin session (**`scope: "local"`**) → `/admin/login`, and protected pages bounce.
- [ ] **E15 — Admin error boundary & 404.** **Test:** trigger an admin error (e.g. duplicate slug) and open a non-existent detail page (`/admin/packages/<bad-id>`). **Expect:** a branded **"We hit a snag"** boundary (Try again / Back to dashboard) inside the shell — not the raw Next.js overlay; the in-shell admin 404 ("We couldn't find that page") for missing records.

---

## F. First-party analytics

- [ ] **F1 — Pageview tracking → dashboard.** **Test:** in a normal browser (not admin, not a bot UA) browse a few public pages → wait a minute → reload the Admin dashboard. **Expect:** the Web analytics panel shows non-zero views/visitors, a populated 14-day chart, and top pages. *(Beaconed by `PageviewTracker` → `POST /api/track`.)*
- [ ] **F2 — Exclusions.** **Test:** browse `/admin/*`; and (technical) send a `/api/track` beacon with a bot User-Agent. **Expect:** `/admin` and `/api` paths are **not** counted; bot UAs matching `/bot|crawl|spider|slurp|preview|monitor|headless|lighthouse/i` are ignored; cross-origin requests and oversized/protocol-relative paths are rejected; **no raw IP is stored** — a salted SHA-256 `visitor_hash` of `ip:userAgent:SERVICE_ROLE_KEY` only.
- [ ] **F3 — Vercel Analytics / Speed Insights.** **Test (on Vercel):** confirm the `/_vercel/insights/*` and `/_vercel/speed-insights/*` scripts load (`<Analytics />` + `<SpeedInsights />` are mounted). **Expect:** they 200 on the live deployment (they 404 on a local `next start` — that's normal).

---

## G. SEO & technical

- [ ] **G1 — robots.txt.** **Test:** visit `/robots.txt`. **Expect:** `allow: /`; disallows exactly **`/admin`, `/api`, `/account`, `/pay`, `/forgot-password`, `/reset-password`**; lists the sitemap; the host is **your live domain** (from `NEXT_PUBLIC_SITE_URL`).
- [ ] **G2 — sitemap.xml.** **Test:** visit `/sitemap.xml`. **Expect:** **6 static routes** — `/` (home), `/tours`, `/destinations`, `/custom-quote`, `/about`, `/contacts` — plus **every published package at `/booking/{slug}`** and **every published destination at `/{slug}`** (destinations live at the locale root, not under `/destinations/`). Each entry carries **hreflang alternates for all 7 locales + `x-default`** on your live domain. (Total URL count is data-dependent — not a fixed 26.) Then submit it in Google Search Console.
- [ ] **G3 — Social preview (OG/Twitter).** **Test:** paste a page URL into a link-preview tester (or share on WhatsApp/Slack). **Expect:** title, description, and the Beyond Borders image; `twitter:card = summary_large_image`; absolute URLs (`metadataBase` from `NEXT_PUBLIC_SITE_URL`).
- [ ] **G4 — Security headers.** **Test:** inspect response headers (set in `next.config.ts`). **Expect:** `Content-Security-Policy` — `default-src 'self'`; `script-src`/`connect-src`/`frame-src` allow only **Supabase** (+ `*.supabase.co`, `wss://*.supabase.co`), **MPGS** (+ `*.gateway.mastercard.com`), and **Vercel** insights hosts; `img-src 'self' data: blob: https:`; `frame-ancestors 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`. *(Note: `'unsafe-inline'` is present for scripts/styles — no nonce pipeline — and `'unsafe-eval'` is dev-only.)* Plus `Strict-Transport-Security` (`max-age=63072000; includeSubDomains; preload` ≈ 2 yr), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`.
- [ ] **G5 — HTTPS & SSL.** **Test:** confirm the padlock / valid certificate on the live domain. *(Manual / live only.)*
- [ ] **G6 — Responsiveness.** **Test:** spot-check home / tours / booking / login / register / admin at ~375px, ~768px, ~1280px. **Expect:** no horizontal scrollbar, readable text, tappable buttons. *(Automated in `responsive.spec.ts`; also verify visually.)*
- [ ] **G7 — 404 pages.** **Test:** visit a nonsense URL (`/xyz`), an unknown in-locale slug (`/en/not-a-place`), and a bad admin path. **Expect:** branded global 404 (`app/not-found.tsx`); localized in-shell 404 with header/footer (`app/[locale]/not-found.tsx`); in-shell admin 404 (`app/admin/not-found.tsx`) — each with a way back.
- [ ] **G8 — Images / next-image.** **Test:** view pages with admin-uploaded images (Supabase Storage URLs). **Expect:** images render through the optimizer (`remotePatterns` allows the Supabase host's `/storage/v1/object/public/**`; `formats: avif, webp`); empty/missing images fall back gracefully via `imageSrc()` (no broken layout, no "hostname not configured" crash).

---

## H. Email & notifications

- [ ] **H1 — Enquiry emails.** **Test:** submit the contact form. **Expect:** customer ack ("We received your Beyond Borders enquiry") + staff notification ("New enquiry from …") to `reservations@`; best-effort (one failed recipient never blocks the other).
- [ ] **H2 — Custom inquiry emails.** **Test:** submit the custom quote. **Expect:** customer ack + staff notification (details grouped by section) to a **de-duplicated** `{reservations@, SMTP_USER}` set.
- [ ] **H3 — Registration emails.** **Test:** register. **Expect:** "account is being reviewed" to the customer + "new customer to verify" to `reservations@`.
- [ ] **H4 — Password-reset code emails.** **Test:** trigger customer forgot, admin forgot, and both change-password flows. **Expect:** a 6-digit code email; **admin codes go only to `reservations@`** (audience `admin`); codes expire **~15 min**.
- [ ] **H5 — Account-verified email.** **Test:** admin verifies a customer. **Expect:** an "account is verified" email to the customer.
- [ ] **H6 — Invoice email.** **Test:** complete a payment. **Expect:** an invoice (traveller, reference, package, amount, transaction id) to the customer **and** `reservations@`; idempotent (one per capture).
- [ ] **H7 — Reserved-domain suppression.** **Test (technical):** any flow that would email a reserved address. **Expect:** the send is **skipped** (logged `[email skipped: non-deliverable recipient]`). Coverage is broad — reserved **TLDs** `.test/.example/.invalid/.localhost` **and** domains `example.com/.org/.net` + `test.com`.
- [ ] **H8 — SMTP toggle.** **Test (technical):** with `SMTP_USER`/`SMTP_PASSWORD` blank. **Expect:** the transport is null so all sends are cleanly skipped (`[email skipped]`); no errors, flows still succeed.
- [ ] **H9 — SMS notifications (if enabled).** **Test:** with `SMS_ENABLED=true` + `SMS_USER_ID`/`SMS_API_KEY`/`SMS_TEAM_CONTACT`, submit a custom inquiry and complete a payment. **Expect:** a business SMS to `SMS_TEAM_CONTACT` (inquiry-received / payment-received) via smslenz.lk. With `SMS_ENABLED=false` (**default**) → no SMS, no errors. SMS failures never block the user flow (fail-soft, logged `[sms skipped/failed/error]`). *(Implemented in `lib/sms/*`, unit-tested.)*

---

## I. Rate limiting & anti-abuse

- [ ] **I1 — Per-form limits surface the wait time.** **Test:** exceed each form's limit. **Expect:** *"You've been rate limited. Please wait about N minute(s)…"* with a real N (payment uses its own copy + `Retry-After`). The DB-backed sliding-window limits (`rate_limit_events`) are:

  | Action | Window | Max | Key |
  |---|---|---|---|
  | Contact enquiry | 60 min | 5 | per **IP** |
  | Booking | 60 min | 10 | per **IP** |
  | Custom inquiry | 60 min | 8 | per **IP + email** |
  | Register | 60 min | 5 | per IP + email |
  | Login (customer) | **15 min** | 10 | per IP + email |
  | Password-reset request | 30 min | 5 | per IP + email |
  | Password-reset verify | 15 min | 10 | per IP + email |
  | Customer password-change (OTP / apply) | 30 / 15 min | 5 / 10 | per IP + email |
  | Admin password reset/change (request / verify) | 30 / 15 min | 5 / 10 | per IP + email |
  | Payment create-session | **10 min** | **20** | per **IP** (429 + `Retry-After`) |
  | Places typeahead `/api/places` | 10 s | 60 | per IP (in-memory) |
  | Cities typeahead `/api/cities` | 10 s | 50 | per IP (in-memory) |

  **NOTE:** **Admin login itself is NOT rate-limited** (only the admin password reset/change flows are). The two typeahead limiters are in-memory per warm instance, not DB-backed.
- [ ] **I2 — Shared-network fairness.** **Test:** two different people (different emails) on the same Wi-Fi submit the custom inquiry / register concurrently. **Expect:** they do **not** block each other (those limits are keyed per IP+email via `scopedRateKey`). *(Contact, booking, and payment are intentionally per-IP volume caps.)*
- [ ] **I3 — Fail-open.** **Test (technical):** if the limiter backend is unavailable (e.g. missing `rate_limit_events`). **Expect:** requests are allowed (never lock real users out); to manually clear a lockout, truncate `rate_limit_events`.
- [ ] **I4 — Time-trap + honeypot.** Covered in §B5/§B6 — both also gate spam.

---

## J. Localization & RTL (per-locale)

- [ ] **J1 — Locale routing.** **Test:** visit `/ar/tours`, `/hi/destinations`, `/zh`, etc. **Expect:** `<html lang>` matches (set on the **root** `app/layout.tsx`); English is unprefixed; others are prefixed; switching language preserves the page.
- [ ] **J2 — RTL.** **Test:** `ar` and `ur`. **Expect:** `<html dir="rtl">`; layout mirrors correctly (nav, cards, forms, buttons); no clipped/overlapping text.
- [ ] **J3 — Translation coverage.** **Test:** skim each locale's key pages + forms. **Expect:** UI strings translated (all 7 message files are at full key parity — machine translation; flag anything obviously wrong, untranslated, or overflowing). Rate-limit / validation / server messages appear in the chosen language where applicable.
- [ ] **J4 — Locale fonts.** **Test:** Arabic/Devanagari/Kannada/Telugu/Chinese pages. **Expect:** the correct script font loads (no tofu/boxes); Latin locales use the display/body/label set.

---

## K. Security & infrastructure (deeper)

- [ ] **K1 — CSP enforcement.** **Test:** in the console, confirm no CSP violations during normal use **and** that the MPGS hosted checkout + Supabase calls are allowed. **Expect:** third-party scripts outside the allowlist are blocked; payment + DB still work.
- [ ] **K2 — Clickjacking / framing.** **Test:** try to embed a page in an `<iframe>` on another origin. **Expect:** blocked (`X-Frame-Options: DENY` / `frame-ancestors 'none'`).
- [ ] **K3 — Protected areas not indexed/leaked.** **Test:** confirm `/admin`, `/account`, `/pay`, `/api` are disallowed in robots and require auth. **Expect:** no protected content reachable unauthenticated or indexable.
- [ ] **K4 — Image upload constraints.** **Test:** in admin, upload a non-image or a >5MB file. **Expect:** rejected with a clear message (*"Use JPEG, PNG, WEBP or AVIF"* / *"maximum size is 5MB"*); only JPEG/PNG/WEBP/AVIF accepted (`MAX_MEDIA_BYTES = 5 MB`); stored in the Supabase **`media`** bucket.
- [ ] **K5 — Customer-verification model.** **Test:** confirm new accounts start unverified and require admin approval; Supabase email-confirmation stays **OFF** (turning it on breaks registration).
- [ ] **K6 — Env / config sanity (go-live).** **Test:** confirm on the live deployment: `ADMIN_ALLOWED_EMAILS=reservations@beyondborders.lk`, `NEXT_PUBLIC_SITE_URL=https://www.beyondborders.lk`, live MPGS creds + `USD_TO_LKR_RATE`, `MPGS_CURRENCY=LKR`, SMTP creds present, DNS/MX for the domain intact (mail deliverable).

---

## L. Performance & resilience

- [ ] **L1 — Page performance.** **Test:** Lighthouse / Web Vitals on home + tours. **Expect:** reasonable LCP/CLS; images sized (no layout shift); modern formats (AVIF/WebP) negotiated. *(Manual; an e2e `performance.spec.ts` exists as a smoke check.)*
- [ ] **L2 — Load / concurrency.** **Test:** run `node scripts/loadtest.mjs 100 30 [baseUrl]` (concurrency, durationSeconds, optional URL — defaults to `http://localhost:3000`) against a running build. **Expect:** 100 concurrent users → ~100% success, no 5xx/crashes; latency degrades gracefully under saturation. *(The script hits locale-prefixed routes incl. a seeded `/en/booking/<slug>` — that package must exist in the DB.)*
- [ ] **L3 — Cold/empty states.** **Test:** pages with no data (e.g. analytics before data, empty lists). **Expect:** graceful empty states, no crashes (track endpoint no-ops to 204 without service env; sitemap/analytics fail soft).

---

## M. Automated test suite (run alongside)

- [ ] **M1 — Unit/component.** `npm run test` (or `npx vitest run`) → all green (**~128 tests**: 16 unit + 9 component files).
- [ ] **M2 — E2E.** Start the app, then `npm run test:e2e` (Playwright) → all green (**44 tests across 13 spec files**): `smoke (3)`, `seo (2)`, `security-headers (2)`, `auth (7)`, `admin (5)`, `admin.authed (9)`, `account.authed (2)`, `booking.authed (3)`, `responsive (2)`, `custom-quote (3)`, `tours (3)`, `accessibility (1)`, `performance (2)`. *(`auth.setup.ts`, `global-teardown.ts`, `helpers.ts` are harness files, not specs.)*
- [ ] **M3 — Types/lint/build.** `npm run typecheck` (`tsc --noEmit`), `npm run lint` (`eslint .`), `npm run build` → all clean. *(Or `npm run test:all` to chain typecheck → lint → vitest+coverage → integration → security audit → e2e.)*

---

## N. Searchable inputs & helper APIs

- [ ] **N1 — Country picker (register + custom inquiry).** **Test:** start typing a country (e.g. "sri"). **Expect:** a flagged, locale-aware dropdown filters as you type; keyboard nav + click-outside close work; selecting a country (a) auto-fills the mobile dialling code and (b) scopes the City picker.
- [ ] **N2 — City picker (dependent, API-backed).** **Test:** with a country chosen, type in City. **Expect:** suggestions come from `/api/cities?country=<code>&q=<text>` (top matches); the field is **disabled until a country is picked** (with a hint); free-text entry is allowed if your city isn't listed.
- [ ] **N3 — Airport/place picker (air builder).** **Test:** type in an air-ticket origin/destination. **Expect:** suggestions from `/api/places?q=<text>` mixing **airports (IATA) and countries**, with a sublabel; min query length enforced; default destination is **Colombo (CMB)**.
- [ ] **N4 — Typeahead API hardening.** **Test (technical):** hammer `/api/cities` and `/api/places`. **Expect:** rate-limited (§I1: cities 50/10s, places 60/10s per IP), query length capped, cache headers set; cross-origin/misuse handled gracefully.

---

## O. Terms & Conditions

- [ ] **O1 — Terms page content.** **Test:** open `/terms`. **Expect:** the full legal copy — payments **non-refundable**; you may be asked to email copies of credit card + passport; right to cross-check the card on arrival in Colombo; the **credit-card-fraud** guideline paragraph (USD 50 deductible cover, report to your card provider, email **`info@beyondborders.lk`** with subject "credit card fraud"); the company's right to amend; and a closing note to tick the box on the payment page. English-only by design. *(Note: this page uses `info@beyondborders.lk` while the rest of the site uses `reservations@beyondborders.lk` — confirm which address support wants here.)*
- [ ] **O2 — Pay-page agreement link.** **Test:** on `/pay/<token>`, click the "Terms & Conditions" link in the agreement checkbox. **Expect:** it opens `/terms`; the Pay button stays disabled until the box is ticked. *(§D8)*

---

### Sign-off

- [ ] All **Recent changes (§1)** re-tested and confirmed.
- [ ] All sections A–O reviewed; failures logged with steps + screenshots.
- [ ] Go-live blockers cleared: one real sandbox→capture payment confirmed (currency/amount), live env vars set (§K6), emails delivering, footer social links wired up (§A8).

_Last updated: 2026-06-29 · reconciled against the codebase (Header/Footer/forms/actions/validation/config) + the original UAT guide (A–G)._
