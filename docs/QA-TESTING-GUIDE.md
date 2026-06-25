# Beyond Borders — Live Site QA / UAT Guide

A complete manual test pass for the **live (production) site**. Work top to bottom and
check each box. For every feature you get **how to test it** and **the expected outcome**.

> **Before you start**
> - Use an **email address you control** for all customer-side tests (registration,
>   enquiries, custom quotes). Each one sends a real acknowledgement to that address,
>   plus a copy to `reservations@beyondborders.lk`.
> - Have a **staff/admin account** ready — an email listed in `ADMIN_ALLOWED_EMAILS`
>   with a password.
> - For payments, know whether the gateway is in **test/sandbox** or **live** mode.
> - The automated suite (`npm run test:all`) already covers most of this against the
>   test DB. This guide is the **manual UAT on the live domain**.

---

## A. Public site & navigation

- [ ] **A1. Home page loads**
  - Test: visit the domain root.
  - Expected: brief intro preloader, then hero, "Our Tour Packages" (3 cards on
    desktop), destinations, footer. No layout overflow, no console errors.

- [ ] **A2. Header navigation**
  - Test: click Home / About / Tours / Destinations / Contact Us; click the BB logo.
  - Expected: each routes to the right page; logo returns home.

- [ ] **A3. "Create account" button (nav)**
  - Test: click it while logged out.
  - Expected: goes to registration. (No "Sign in" in the nav by design — login is
    reached from the register page or `/login`.)

- [ ] **A4. Mobile menu**
  - Test: on a phone width, tap the hamburger.
  - Expected: drawer slides in with nav + Create account; tapping a link or the
    backdrop closes it.

- [ ] **A5. Language switcher (7 languages)**
  - Test: switch to العربية / हिन्दी / ಕನ್ನಡ / తెలుగు / اردو / 中文.
  - Expected: content translates; URL gets the locale prefix (e.g. `/ar/tours`);
    **Arabic & Urdu render right-to-left**. (Machine translations — proof-read
    separately.)

- [ ] **A6. Cookie banner**
  - Test: first visit → Accept or Decline.
  - Expected: banner dismisses and doesn't reappear.

---

## B. Lead forms (the "contact → reservations + admin" pattern)

- [ ] **B1. Contact form** (`/contacts`)
  - Test: fill name, email (yours), phone, country, package, message → submit.
  - Expected: success message on the form **AND**
    1. an **enquiry appears in Admin → Enquiries** (and the dashboard "Recent enquiries"),
    2. an email lands in **`reservations@beyondborders.lk`** ("New enquiry from …"),
    3. an **acknowledgement email** arrives at the address you entered.

- [ ] **B2. Custom quote form** (`/custom-quote`)
  - Test: pick an inquiry type (Package / Hotel / Air ticket / Transport), fill the
    details → submit.
  - Expected: success message **AND**
    1. a record in **Admin → Custom inquiries**,
    2. a staff email to **reservations@**,
    3. an acknowledgement to the customer. (SMS is disabled, so no text.)

- [ ] **B3. Form anti-spam**
  - Test: submit a form instantly (under ~2.5s) or many times quickly.
  - Expected: blocked with a "please wait" / too-many-attempts message (bot time-trap
    + IP rate limit). A hidden honeypot field also silently rejects bots.

---

## C. Customer accounts

- [ ] **C1. Registration** (`/register`)
  - Test: fill First/Last name, Country, City, Date of birth, Passport number +
    expiry, Email (yours), Mobile, Password → Create account.
  - Expected: redirected to your **account page showing "awaiting verification"** **AND**
    1. a **new applicant appears in Admin → Customers ("New applications")** with all details,
    2. a "your account is being reviewed" email to the customer,
    3. a "new customer to verify" email to **reservations@**.
  - Edge cases: future date of birth, expired passport, password < 8 chars, or a
    duplicate email are each rejected with a message.

- [ ] **C2. Login** (`/login`)
  - Test: log in with the C1 account. Try the **eye icon** on the password field; try
    a wrong password.
  - Expected: correct credentials → `/account`; wrong → error, stays on login. Eye
    toggles visibility. The **back-arrow (top-left)** returns home; "Forgot password?"
    and "Create an account" links work.

- [ ] **C3. Forgot password (customer)** (`/forgot-password`)
  - Test: enter your email → receive a **6-digit code** by email → enter it + a new
    password on the reset page → log in with the new password.
  - Expected: code email arrives (valid ~15 min); valid code + new password →
    "password updated", login works; wrong/expired code is rejected.

- [ ] **C4. Account page** (`/account`, logged in)
  - Test: view it.
  - Expected: greeting with your name, verification status, your bookings list, and a
    **"Change password"** card.

- [ ] **C5. Change password from account**
  - Test: in the account card → "Send verification code" → enter current password, a
    new password, and the emailed code → submit.
  - Expected: code emailed; on success password changes (log out/in to confirm). Wrong
    current password or wrong code is rejected.

- [ ] **C6. Logout**
  - Test: sign out.
  - Expected: session ends; protected pages bounce to login.

---

## D. Booking & payment

- [ ] **D1. Purchase gating (verified-only)**
  - Test: as an **unverified** customer, open a package and look at the reserve area.
  - Expected: instead of a booking form you see a "register / awaiting verification"
    notice — **unverified customers cannot book**.

- [ ] **D2. Verify the customer (admin step)**
  - Test: Admin → Customers → find the applicant → **"Verify (allow purchases)"**.
  - Expected: they move to "Verified" and receive an **"account is verified"** email.

- [ ] **D3. Booking a package** (verified customer)
  - Test: open `/booking/<package>`, fill travel dates / travellers / notes → submit
    (wait ~3s first).
  - Expected: a **booking record is created** (status *awaiting payment*) and a
    **payment is initiated**, then you're **redirected to the hosted checkout
    (`/pay/<token>`)** showing traveller + amount. The booking also appears in
    **Admin → Bookings**.

- [ ] **D4. Payment** (test or live gateway)
  - Test: on the pay page, complete the card payment via the MPGS hosted checkout
    (use a **sandbox test card** if in test mode).
  - Expected: success → a **result page confirming payment**; booking status updates to
    **paid/confirmed**; an **invoice email** goes to the customer **and reservations@**.
  - ⚠️ **Verify the amount/currency actually charged** — packages display **USD**;
    confirm the gateway charges the intended currency.

- [ ] **D5. Pay-link expiry**
  - Test: open an old pay link (older than `PAY_LINK_TTL_HOURS`).
  - Expected: shown as expired; no payment possible.

---

## E. Admin panel

- [ ] **E1. Admin login** (`/admin/login`)
  - Test: log in with an allowlisted staff email; try a non-allowlisted email.
  - Expected: allowlisted → dashboard; non-allowlisted (even with valid Supabase
    creds) → rejected.

- [ ] **E2. Admin route gating**
  - Test: while logged out, hit `/admin`, `/admin/packages`, `/admin/users`, etc.
  - Expected: all redirect to `/admin/login`.

- [ ] **E3. Admin forgot / reset password**
  - Test: `/admin/login` → "Forgot password?" → staff email → 6-digit code → reset.
  - Expected: code emailed to the staff address; reset works; sign in with the new password.

- [ ] **E4. Dashboard**
  - Test: open `/admin`.
  - Expected: a **"Web analytics"** panel (views, unique visitors for 24h/7d/30d, a
    14-day trend chart, top pages — see F1), operational metrics
    (packages/destinations/enquiries/bookings counts), and recent enquiries/bookings.

- [ ] **E5. Packages management**
  - Test: Admin → Packages → open one → edit a field / upload an image → save; create
    a new package.
  - Expected: changes persist and reflect on public `/tours` and the package page.
    Newly published packages auto-appear in the sitemap.

- [ ] **E6. Destinations management**
  - Test: Admin → Destinations → edit / create.
  - Expected: changes reflect on `/destinations` and the destination page.

- [ ] **E7. Enquiries**
  - Test: Admin → Enquiries → open one → change its status.
  - Expected: the B1 enquiry is listed; status updates persist.

- [ ] **E8. Custom inquiries**
  - Test: Admin → Custom inquiries.
  - Expected: the B2 inquiry is listed with its details.

- [ ] **E9. Bookings**
  - Test: Admin → Bookings → open one.
  - Expected: D3 bookings listed with traveller, reference, amount, status.

- [ ] **E10. Customers — verify / activate / deactivate**
  - Test: Verify an applicant (E/D2); **Deactivate login** on a customer, then try to
    log in as them; Activate again.
  - Expected: Verify → can purchase + email. **Deactivate → that customer can no longer
    log in** (active session dropped); Activate restores access.

- [ ] **E11. Settings — change admin password**
  - Test: Admin → Settings → "Send verification code" → current password + new + code → save.
  - Expected: code emailed to the admin; password changes; you stay logged in.

- [ ] **E12. Admin responsiveness**
  - Test: open the admin on a phone.
  - Expected: top bar with hamburger; sidebar opens as a drawer; tables/cards reflow;
    no overflow.

- [ ] **E13. View site / Sign out**
  - Test: use the sidebar "View site ↗" and "Sign out".
  - Expected: opens the public site / ends the admin session.

---

## F. Analytics

- [ ] **F1. First-party web analytics**
  - Test: browse a few **public** pages in a normal browser (not the admin) → wait a
    minute → reload the Admin dashboard.
  - Expected: the Web analytics panel shows non-zero views/visitors, a populated 14-day
    chart, and top pages. (Admin pages and bots are excluded from counts.)

---

## G. SEO & technical

- [ ] **G1. robots.txt** — visit `/robots.txt`. Expected: allows the site, disallows
  `/admin /api /account /pay /forgot-password /reset-password`, lists the sitemap, all
  on **your live domain** (confirms `NEXT_PUBLIC_SITE_URL` is set).

- [ ] **G2. sitemap.xml** — visit `/sitemap.xml`. Expected: ~26 URLs (home, tours,
  destinations, about, contacts, custom-quote, every package, every destination) with
  hreflang for all 7 locales, on your live domain. Then **submit it in Google Search
  Console**.

- [ ] **G3. Social preview** — paste a page URL into a link-preview tester (or share on
  WhatsApp/Slack). Expected: title, description, and the Beyond Borders image (OG tags).

- [ ] **G4. HTTPS & security headers** — confirm the padlock (valid SSL); optionally
  check response headers include CSP, HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`.

- [ ] **G5. Responsiveness** — spot-check home / tours / booking / login / register /
  admin at phone (~375px), tablet (~768px), desktop (~1280px+). Expected: **no
  horizontal scrollbar**, readable text, tappable buttons.

- [ ] **G6. 404** — visit a nonsense URL. Expected: a proper not-found page.

---

## Live-specific reminders

- **Emails are real now** — every customer-side test sends to the address you used +
  `reservations@`. If they land in spam, check SPF / DKIM / DMARC for the sending domain.
- **Money is real if the gateway is live** — do the first end-to-end payment in **test
  mode**, and double-check the charged **currency/amount** before switching to live.
- **Currency note** — packages display **USD**; confirm `MPGS_CURRENCY` and the gateway
  charge the intended currency before taking real payments.
