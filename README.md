# Beyond Borders — Next.js

The Beyond Borders landing page (white & gold, Soneva/Six Senses–inspired) rebuilt
as a **Next.js 16 (App Router) + React 19 + TypeScript** application, converted from
the original single-file `BBdesign/index.html`.

## Stack

- **Next.js 16** (App Router, Turbopack, cached public routes, dynamic admin)
- **React 19** + **TypeScript** (strict)
- **Supabase** — Postgres, Auth, Storage, RLS-backed admin/content
- **Resend + React Email** — enquiry, booking, pay-link and receipt emails
- **MPGS Hosted Checkout** — Seylan Bank payment flow, gated by `PAYMENTS_ENABLED`
- **motion** (v12) + **lenis** — preloader intro, smooth scroll, reveals, count-ups, parallax, pinned horizontal destinations

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
```

Backend setup:

```bash
supabase start
npm run seed
```

Production:

```bash
npm run build
npm start
```

## Structure

```
app/
  layout.tsx        # fonts, metadata, <html>/<body>, globals.css
  page.tsx          # composes the sections (server component)
  globals.css       # full design system, ported 1:1 from the original
  about/page.tsx    # About route
  tours/page.tsx    # Tour packages route
  destinations/page.tsx
  contacts/page.tsx
  [slug]/page.tsx   # Destination detail routes
  admin/             # Supabase Auth protected staff dashboard
  api/payments/      # MPGS hosted checkout route handlers
  pay/[token]/       # secure deferred payment links
components/
  Preloader.tsx     # loading overlay markup
  Header.tsx        # "use client" — sticky header, scroll hide/show, mobile menu
  Hero.tsx
  About.tsx
  Destinations.tsx  # 8 panels, data-driven
  Tours.tsx
  Experience.tsx
  Contact.tsx       # server; renders <ContactForm />
  ContactForm.tsx   # "use client" — progressive server-action form
  Select.tsx        # "use client" — accessible custom dropdown (replaces native <select>)
  Footer.tsx
  SiteEffects.tsx   # "use client" — all motion/Lenis orchestration (renders null)
public/
  assets/images/... # brand, heroes, destinations, tours, misc
lib/
  data/             # Supabase-backed public/admin data access
  supabase/         # server, service-role and public clients
  validation/       # Zod schemas
  email/            # Resend client + React Email templates
  payments/         # MPGS Hosted Checkout client
scripts/
  seed.ts           # imports seed-data.ts into Supabase
supabase/
  migrations/       # schema, RLS policies, Storage bucket
```

## Notes

- Motion is progressive: all content is visible without JS; animations only enhance.
  `prefers-reduced-motion` is fully respected (preloader hides immediately, no smooth scroll).
- Public content reads from Supabase published rows. Run `npm run seed` after applying
  migrations to load the original destination and package content.
- Payments remain disabled until real Seylan/MPGS credentials are present and
  `PAYMENTS_ENABLED=true`.
