# Beyond Borders — User Guide

**Super-User Manual for the Beyond Borders Admin Platform**

| | |
|---|---|
| **Document** | User Guide — Super Users |
| **Project** | Beyond Borders Website & Admin Platform |
| **Version** | v1.1 |
| **Audience** | Admin & super-user staff (non-technical) |
| **Prepared by** | Kaizen AI for Beyond Borders |

> **How to read this guide.** You do **not** need any technical knowledge. Each section is a self-contained "how to" for one area of the admin panel, written as plain steps. Skim the [Table of Contents](#table-of-contents), jump to what you need, and keep the [Quick-Task Cheat Sheet](#18-quick-task-cheat-sheet) handy for day-to-day work.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started — Logging In](#2-getting-started--logging-in)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Package Management](#4-package-management)
5. [Destination Management](#5-destination-management)
6. [Booking Management](#6-booking-management)
7. [Customer Accounts & Verification](#7-customer-accounts--verification)
8. [Enquiry Management](#8-enquiry-management)
9. [Custom Inquiry Management](#9-custom-inquiry-management)
10. [Support Panel](#10-support-panel)
11. [Analytics](#11-analytics)
12. [Notifications — What Gets Sent, and When](#12-notifications--what-gets-sent-and-when)
13. [Your Multilingual Website](#13-your-multilingual-website)
14. [Settings & Your Account](#14-settings--your-account)
15. [Reference Numbers Explained](#15-reference-numbers-explained)
16. [Security & Data Protection](#16-security--data-protection)
17. [Troubleshooting](#17-troubleshooting)
18. [Quick-Task Cheat Sheet](#18-quick-task-cheat-sheet)
19. [Frequently Asked Questions](#19-frequently-asked-questions)
20. [Glossary](#20-glossary)
21. [Getting Help](#21-getting-help)

---

## 1. Introduction

This guide is for the Beyond Borders team members who manage the website day to day through the **admin panel**. It walks through each area of the dashboard so you can update content, manage bookings, verify customers, handle enquiries, raise support tickets, and read your analytics — all without needing a developer.

### Before you start

- You do **not** need any technical knowledge to use the admin panel.
- **Changes you make go to the live website.** Take care when editing content that is set to *Published*.
- If anything looks broken or behaves unexpectedly, **contact Kaizen AI support** (see [§21](#21-getting-help)) rather than attempting a fix.

> **The golden rules**
> 1. When in doubt, set content to **Draft** instead of deleting it.
> 2. Never share your login.
> 3. If an error page appears, take a screenshot and note what you were doing before contacting support.

### What the platform does at a glance

| Your customers can… | You (staff) can… |
|---|---|
| Browse tours & destinations in **7 languages** | Create/edit tour **packages** and **destinations** |
| Send a **contact enquiry** | Read & action **enquiries** and **custom inquiries** |
| Request a **custom quote** (package / hotel / air ticket / transport) | **Verify** customers so they can purchase |
| Register an account & **book online** | Track **bookings** and **payments** |
| Pay securely by card (**deferred pay link**) | Read **analytics**; raise **support tickets** |

---

## 2. Getting Started — Logging In

1. Open your admin URL: **`https://<your-domain>/admin`** (for example `https://beyondborders.lk/admin`).
2. Enter the **email** and **password** for your admin account.
3. You land on the **Dashboard**, which shows a summary of recent activity and your web analytics.

If you forget your password, click **“Forgot your password?”** on the login screen — a **6-digit one-time code** is emailed to the Beyond Borders reservations inbox. Enter it to set a new password. (See [§14](#14-settings--your-account).)

### Only one person can be signed in at a time

Beyond Borders uses **one shared admin account**, and for safety **only one device can actively use the panel at a time**. This prevents two people overwriting each other's edits. Here's what you'll see:

- **The seat is free** → you sign in normally and start working.
- **Someone else is already active** → you'll see a **“Waiting for approval…”** screen. The person currently using the panel gets a pop-up: *“Someone is trying to sign in.”* They choose:
  - **Allow them in** → they are signed out and *you* take over.
  - **Keep my session** → you stay locked out for now; try again later.
- If several people try to sign in at once, the active user resolves them together — **one “Allow” hands the panel to the first person who asked**, and **one “Keep my session” dismisses everyone**.
- If the active user simply closes their laptop, the seat frees automatically after about a minute and the next person can sign straight in.

> **Keep your account secure**
> - Never share your login. Coordinate with your team about who is using the panel.
> - Use a strong, unique password stored in a password manager.
> - Always **Sign out** (bottom-left of the menu) when you're done, especially on a shared computer.

---

## 3. Dashboard Overview

The **left-hand navigation menu** lets you move between areas at any time. It's the same on every page.

| Menu item | What you use it for |
|---|---|
| **Dashboard** | Your home screen: web analytics + recent-activity summary. |
| **Packages** | Create and edit the tour packages shown on the website. |
| **Destinations** | Create and edit the destination pages. |
| **Enquiries** | Read and action messages from the contact form. |
| **Custom inquiries** | Handle custom-quote requests (package / hotel / air ticket / transport). |
| **Bookings** | View bookings and their payment status. |
| **Customers** | Approve (verify) customers and enable/disable logins. |
| **Support panel** | Raise and track internal support tickets with Kaizen AI. |
| **Settings** | Change your admin password. |
| **View site ↗** | Open the public website in a new tab. |
| **Sign out** | Log out of the admin panel. |

The Dashboard's **Web analytics** panel (top of the home screen) shows views and visitors for the last 24 hours / 7 days / 30 days, a 14-day trend chart, and your **top pages** by friendly name. See [§11](#11-analytics).

---

## 4. Package Management

**Packages** are the tours you sell — the core offering shown to customers on the *Tours* pages and used for online booking.

### 4.1 Creating a new package

1. Go to **Packages** → **“Add package”** (or *New*).
2. Fill in the details: **title, slug, tier, duration, hotels, destinations, summary, inclusions**, and the **day-by-day itinerary** (one line per day, in the format `Day 1 | Title | Description`).
3. Set the **price** and **currency** (see the pricing note below).
4. Add images (see [§4.3](#43-adding-images)).
5. Set **Status** to **Published** to make it live, or **Draft** to keep it hidden while you work.
6. Click **Save package**. Published packages appear on the website immediately.

> **Pricing & currency.** Prices are charged in **USD**. New packages default to USD. Customers are shown the price and pay by card through the secure gateway — you never handle card details yourself.

### 4.2 Editing, hiding, or deleting a package

- **Edit** — open the package from the list, make changes, **Save**.
- **Hide temporarily** — set **Status** to **Draft** (recommended over deleting).
- **Delete permanently** — use **Delete**. *This cannot be undone*, so prefer **Draft** if you might use the package again.

### 4.3 Adding images

Each package has two images:

- **Card image** — the thumbnail shown on the tours listing.
- **Hero image** — the large banner on the booking page.

To add either one, click **Upload** and choose a file (**JPEG, PNG, WEBP or AVIF, up to 8 MB each**). The image uploads and a preview appears; the **Save** button enables once it's ready. **You can change both images in a single save.** You may also paste an image URL instead of uploading.

> **Tip — make your listings look premium**
> - Use **high-quality landscape photos**.
> - Keep image proportions consistent across packages so the listing pages look tidy.
> - Lead your descriptions with what makes the trip special, then the practical details.

---

## 5. Destination Management

**Destinations** are the inspirational location pages (e.g. *Sigiriya*, *Galle*) shown under *Destinations* and linked from packages. They work exactly like packages:

1. Go to **Destinations** → **Add destination**.
2. Fill in **title, slug, tagline, key attraction, summary, highlights** (one per line), and **best for**.
3. Add the **Card image** and **Hero image** (same upload rules as packages — up to 8 MB each, both in one save).
4. Set **Published** or **Draft**, then **Save**.

The same **Draft-vs-Delete** guidance applies: prefer **Draft** to hide something you may reuse.

---

## 6. Booking Management

The **Bookings** area lists every booking made through the website, newest first. Each booking carries a **reference number** like **`BB-ORD-1042`** so you and the customer can refer to it easily.

### 6.1 Understanding booking statuses

| Status | Meaning | Typical next action |
|---|---|---|
| **New** | Just submitted; not yet actioned. | Review and confirm availability. |
| **Awaiting payment** | The customer has a booking but hasn't paid yet. | The customer completes their secure pay link. |
| **Paid** | Payment was captured successfully. | Arrange the trip; send confirmation. |
| **Confirmed** | You've accepted/confirmed the booking. | Proceed with delivery. |
| **Cancelled** | Cancelled by you or the customer. | Record the reason if useful. |

### 6.2 How payment works (you don't handle cards)

Booking uses a **deferred, secure card payment**:

1. A **verified** customer books a package → the booking is created as **Awaiting payment**.
2. They're taken to a secure **pay link** (`/pay/…`) hosted by the payment gateway, where card details are entered **on the bank's own page** — never on your site and never seen by staff.
3. When payment succeeds, the booking automatically becomes **Paid**, a **receipt email** goes to the customer, and a payment SMS/email notification is sent (see [§12](#12-notifications--what-gets-sent-and-when)).

> **You never see or enter card numbers.** All card handling stays with the Mastercard payment gateway (Seylan Bank). This keeps Beyond Borders out of scope for card-security compliance.

### 6.3 Working with a booking

- Click a booking to open its full details — customer, package, travel dates, travellers, amount, and status.
- Update the **status** as the booking progresses through your workflow.

> **Customer data — handle with care**
> Bookings contain **personal information** (names, contact details, travel dates, passport details). Only access it for legitimate business reasons and never export or share it outside your team. This is part of your responsibilities as the **data controller** under Sri Lanka's **Personal Data Protection Act** — see [§16](#16-security--data-protection).

---

## 7. Customer Accounts & Verification

This is one of the most important workflows to understand. Customers can **register and log in freely**, but **they cannot book or pay until you approve them.** This "human gate" lets you vet who transacts.

### 7.1 The verification workflow

1. A customer registers on the website. Their account is created but marked **unverified**. They can sign in and see an *“awaiting verification”* message, but the booking form is hidden.
2. You receive a *“New customer to verify”* email.
3. Go to **Customers**, find the new account, and click **“Verify (allow purchases)”**.
4. The customer is emailed that they're approved, and the booking form unlocks for them.

### 7.2 Enabling / disabling a login

Independently of verification, each customer has an **active/inactive** login switch:

- **Deactivate login** — immediately blocks that customer from signing in (their current session is ended). Use this if an account is problematic.
- **Activate login** — restores access.

> **Verified vs. Active — two different switches**
> - **Verified** = *may purchase*. **Active** = *may sign in*.
> - A customer can be signed-in-but-unverified (can browse their account, can't book), or verified-but-deactivated (blocked entirely).

---

## 8. Enquiry Management

**Enquiries** are messages sent through the website's **Contact** form. They're collected in one place so nothing slips through the cracks.

- Open an enquiry to read the **full message and the sender's contact details** (name, email, phone, country).
- Update its **status** as you work it:

| Status | Meaning |
|---|---|
| **New** | Just received; not yet handled. |
| **Contacted** | You've reached out / are in conversation. |
| **Closed** | Handled — no further action needed. |

- **Respond promptly.** Fast replies to enquiries are one of the biggest drivers of bookings.

Every new enquiry also emails the reservations inbox **and** sends the customer an acknowledgement, so both sides have a record (see [§12](#12-notifications--what-gets-sent-and-when)).

---

## 9. Custom Inquiry Management

The website's **Custom Quote** wizard lets customers request a tailored quote of one of **four types**. These arrive under **Custom inquiries**, each with a reference like **`BB-INQ-1055`**.

| Type | What the customer is asking for |
|---|---|
| **Package** | A tailored tour package. |
| **Hotel** | Hotel-only booking assistance. |
| **Air ticket** | Flight booking (with origin/destination, dates, cabin, passengers). |
| **Transport** | Ground transport / transfers. |

- Open an inquiry to see the **type-specific details** the customer submitted plus their contact info.
- Update the **status** (**New → Contacted → Closed**) as you work it, exactly like enquiries.
- Each new custom inquiry notifies the reservations inbox and the customer by email, and sends the **business team an SMS** ([§12](#12-notifications--what-gets-sent-and-when)).

---

## 10. Support Panel

The **Support panel** is your direct line to Kaizen AI for anything about the platform itself — a bug, a question, or a change request. Each ticket gets a unique number like **`KZN-0421`**.

### 10.1 Raising a ticket

1. Go to **Support panel** → **Create ticket**.
2. Enter a **title** and **description**. Optionally attach a **screenshot** (helpful for visual issues).
3. Click **Create ticket**. It appears in your list immediately.

### 10.2 Managing tickets

- **Click a ticket** to open the full detail (title, description, screenshot, date, status).
- **Edit** a ticket to correct or add detail; **Delete** a ticket you no longer need.
- **Status** (`Open` → `In progress` → `Closed`) is updated by **Kaizen AI** from their side as they work your request — you'll see it change here. You don't set the status yourself.

> **When to raise a ticket vs. contact support directly.** Use a ticket for anything you want tracked (bugs, change requests, questions). For urgent outages ("the site is down"), also reach out through your usual support channel — see [§21](#21-getting-help).

---

## 11. Analytics

The Dashboard's **Web analytics** panel gives you a clear picture of how your website is performing, so you can make decisions from real data rather than guesswork. It's **privacy-friendly** — first-party, with **no cookies and no personal data** (visitors are counted using an anonymised fingerprint).

### 11.1 What you can see

- **Views & visitors** for the last **24 hours, 7 days, and 30 days**.
- A **14-day trend chart** of daily views.
- **Top pages (7 days)** by friendly name (e.g. *Home*, *Tours*, *Contact*), so you can see what's attracting attention.

### 11.2 Using analytics well

- **Check it weekly** to spot trends early rather than reacting late.
- If a **package gets lots of views but few bookings**, revisit its price, photos, or description.
- Rising **Custom inquiry / enquiry** volume is a leading indicator — make sure you're replying quickly.

> **Two analytics layers.** The in-panel numbers are Beyond Borders' own first-party analytics. Kaizen AI also runs **Vercel Analytics & Speed Insights** behind the scenes for deeper performance and traffic-source data — ask support if you'd like a report.

---

## 12. Notifications — What Gets Sent, and When

The platform keeps everyone informed automatically. **Nothing you do is silently lost** — the key events email the team and (where relevant) the customer, and some also send an SMS.

| Event | Admin panel | Team email (reservations@) | Customer email | SMS |
|---|:---:|:---:|:---:|---|
| **Package purchased** (payment received) | ✓ | ✓ | ✓ (receipt) | Business + customer |
| **Contact enquiry** | ✓ | ✓ | ✓ (acknowledgement) | — |
| **Custom inquiry** | ✓ | ✓ | ✓ (acknowledgement) | Business |
| **New customer to verify** | ✓ | ✓ | — | — |
| **Customer password reset** | — | — | Code to the customer's email | — |
| **Admin password reset** | — | Code to reservations@ **only** | — | — |

> **SMS status.** SMS notifications run on the **Dialog** gateway and are **ready in the platform**. They switch on once the registered sender name and business number(s) are finalised on the Dialog account — Kaizen AI will confirm when it's live. Email works today.

---

## 13. Your Multilingual Website

Your public site is presented in **7 languages** — English, Arabic, Hindi, Kannada, Telugu, Urdu, and Chinese — with **Arabic and Urdu shown right-to-left**. Visitors switch language from the site's language selector, and search engines are told about every language version automatically.

**What this means for you:**

- You author packages and destinations in **English** in the admin panel. The other languages are generated automatically, so you don't maintain seven copies by hand.
- **Proper nouns** (hotel brands, place names) intentionally stay in English across all languages.
- The **admin panel itself is English-only** — only the *public* site is translated.

> **Note.** The non-English translations are currently machine-generated and pending a human proofing pass (tracked by Kaizen AI). If you spot wording that needs polish in a specific language, raise a [Support ticket](#10-support-panel).

---

## 14. Settings & Your Account

**Settings** is where you change your admin password.

1. Go to **Settings → Change password**.
2. Enter your **current password** and your **new password**.
3. A **one-time code** is emailed to the reservations inbox for confirmation — enter it to complete the change.

If you've **forgotten** your password, use **“Forgot your password?”** on the login screen (or the link in Settings). A 6-digit code is emailed to the reservations inbox; enter it to set a new password.

> **Adding or removing staff access.** Admin access is controlled by an **approved-email list** managed by Kaizen AI (not self-service). To add or remove a colleague's access, raise a [Support ticket](#10-support-panel) or contact support with the email address to add/remove.

---

## 15. Reference Numbers Explained

You'll see three families of reference numbers. They're **stable and human-friendly**, so you can quote them to customers or to support.

| Prefix | Example | What it identifies | Where you see it |
|---|---|---|---|
| **`BB-ORD-`** | `BB-ORD-1042` | A booking / order (paid tour) | Bookings, receipt emails, payment SMS |
| **`BB-INQ-`** | `BB-INQ-1055` | A custom-quote inquiry | Custom inquiries, inquiry emails/SMS |
| **`KZN-`** | `KZN-0421` | An internal support ticket | Support panel |

---

## 16. Security & Data Protection

Security is built into the platform, but a few habits keep it strong:

- **One login per person is the ideal** — even though the account is shared today, coordinate who's active and never post the password in chat or email. Store it in a password manager.
- **Always sign out** on shared or public computers.
- **Only one admin can be active at a time** (see [§2](#2-getting-started--logging-in)) — this is a safety feature, not a fault.
- **You never handle card data** — payments happen entirely on the bank's secure gateway.

### Data protection (PDPA)

Bookings, customer accounts, enquiries and custom inquiries contain **personal data** (names, contact details, travel dates, passport details). As the **data controller** under Sri Lanka's **Personal Data Protection Act**, Beyond Borders is responsible for handling it lawfully:

- Access personal data **only for legitimate business reasons**.
- **Do not export, copy, or share** customer data outside your team.
- If a customer asks you to delete their data or you have a privacy concern, raise it with Kaizen AI. The *Developer Guide* documents how data is stored, encrypted in transit, and protected by database access rules.

---

## 17. Troubleshooting

| Symptom | What to do |
|---|---|
| **I saved a change but can't see it on the website.** | Check the item's **Status is Published**, not Draft. Then refresh the page (updates appear within a moment). |
| **“Waiting for approval…” when I log in.** | Someone else is using the panel. Wait for them to **Allow you in**, or try again later. Not a fault. |
| **A “We hit a snag” page appeared.** | Click **Try again** or **Back to dashboard**. If it repeats, screenshot it and contact support. |
| **My image won't upload.** | Use JPEG/PNG/WEBP/AVIF **under 8 MB**. Very large phone photos may need to be smaller. |
| **A customer says they can't book.** | Check the customer is **Verified** in **Customers** (and their login is **Active**). |
| **A customer didn't get their receipt/code email.** | Ask them to check spam. If still missing, raise a support ticket with their email and the booking reference. |
| **I was signed out unexpectedly.** | Either another admin took over the panel, or your session was idle for a while. Simply sign back in. |

> **Never** try to fix an error from the database or code. Take a screenshot, note what you were doing, and contact Kaizen AI support.

---

## 18. Quick-Task Cheat Sheet

| I want to… | Do this |
|---|---|
| Add a new tour | **Packages → Add package** → fill details + images → **Published** → Save |
| Temporarily hide a tour | Open it → set **Status: Draft** → Save |
| Change a price | Open the package → update **Price** → Save |
| Add a destination page | **Destinations → Add destination** → fill + images → Save |
| Let a customer buy | **Customers →** find them **→ Verify (allow purchases)** |
| Block a customer's login | **Customers →** find them **→ Deactivate login** |
| See who's booked | **Bookings** (look for **Paid**) |
| Reply to a message | **Enquiries** / **Custom inquiries** → open → action → set status |
| Ask Kaizen for help/changes | **Support panel → Create ticket** |
| Check performance | **Dashboard → Web analytics** |
| Change my password | **Settings → Change password** (enter emailed code) |

---

## 19. Frequently Asked Questions

**I made a change but I can't see it on the website.**
Check the item's status is **Published**, not Draft. If it's published, refresh the page or clear your browser cache — updates are normally visible within a moment of saving.

**I accidentally deleted a package / destination. Can I get it back?**
Deletions are **permanent** from the admin panel. Contact Kaizen AI support as soon as possible — in some cases it may be recoverable from a recent database backup, but this is not guaranteed. **Prefer Draft over Delete** to avoid this.

**A customer can't see the booking form / can't pay.**
They probably aren't **Verified** yet. Go to **Customers**, find them, and click **Verify (allow purchases)**. Also confirm their login is **Active**.

**Why can't my colleague and I both use the panel at once?**
By design, only one device can actively use the shared admin account at a time — it prevents conflicting edits. See [§2](#2-getting-started--logging-in) for how the hand-over works.

**How do I add a new staff member to the admin panel?**
Admin access is by an **approved-email list** managed by Kaizen AI. Raise a [Support ticket](#10-support-panel) or contact support with the email to add. It isn't a self-service setting.

**Are the SMS notifications working?**
The SMS feature is built and ready; it switches on once the sender details are finalised on the Dialog account. Email notifications work now. Kaizen AI will confirm when SMS goes live.

**Something looks broken or an error appeared.**
Don't try to fix it from the database or code. Take a screenshot, note what you were doing, and contact Kaizen AI support.

**Who do I contact for help?**
Kaizen AI support — see your **Welcome & Thank You Pack** for the support email and response times.

---

## 20. Glossary

| Term | Meaning |
|---|---|
| **Admin panel** | The private staff dashboard at `/admin` where you manage everything. |
| **Package** | A tour product shown on the site and sold via booking. |
| **Destination** | An inspirational location page (e.g. Sigiriya). |
| **Published / Draft** | *Published* = live on the website; *Draft* = hidden while you work. |
| **Booking** | A customer's order for a package (reference `BB-ORD-…`). |
| **Custom inquiry** | A tailored quote request via the Custom Quote wizard (`BB-INQ-…`). |
| **Enquiry** | A message from the Contact form. |
| **Verified customer** | A customer you've approved to purchase. |
| **Active / inactive login** | Whether a customer can sign in at all. |
| **Pay link** | The secure, time-limited link where a customer pays by card. |
| **Support ticket** | An item you raise for Kaizen AI (`KZN-…`). |
| **OTP** | One-Time Passcode — a short code emailed to confirm a password change/reset. |
| **Draft-first** | The habit of hiding content as Draft rather than deleting it. |

---

## 21. Getting Help

For questions, problems, or change requests:

1. **Raise a Support ticket** in the admin panel (**Support panel → Create ticket**) — this is tracked and is the best route for most things.
2. For **urgent issues** (e.g. the site appears down), also contact **Kaizen AI support** directly using the email and response times in your **Welcome & Thank You Pack**.

When contacting support, please include:

- What you were trying to do,
- A **screenshot** of anything unexpected,
- The relevant **reference number** (`BB-ORD-…`, `BB-INQ-…`, or `KZN-…`) if applicable.

---

*Prepared by Kaizen AI for Beyond Borders. This guide describes the admin platform for non-technical super-users; the companion **Developer Guide** covers the technical architecture, security, and maintenance in depth.*
