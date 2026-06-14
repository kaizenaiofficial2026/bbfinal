# Beyond Borders — Next.js

The Beyond Borders landing page (white & gold, Soneva/Six Senses–inspired) rebuilt
as a **Next.js 16 (App Router) + React 19 + TypeScript** application, converted from
the original single-file `BBdesign/index.html`.

## Stack

- **Next.js 16** (App Router, Turbopack, static prerender)
- **React 19** + **TypeScript** (strict)
- **next/font** — Lato and Montserrat (self-hosted, no network font load)
- **motion** (v12) + **lenis** — preloader intro, smooth scroll, reveals, count-ups, parallax, pinned horizontal destinations

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
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
components/
  Preloader.tsx     # loading overlay markup
  Header.tsx        # "use client" — sticky header, scroll hide/show, mobile menu
  Hero.tsx
  About.tsx
  Destinations.tsx  # 8 panels, data-driven
  Tours.tsx
  Experience.tsx
  Contact.tsx       # server; renders <ContactForm />
  ContactForm.tsx   # "use client" — form + static submit note
  Select.tsx        # "use client" — accessible custom dropdown (replaces native <select>)
  Footer.tsx
  SiteEffects.tsx   # "use client" — all motion/Lenis orchestration (renders null)
public/
  assets/images/... # brand, heroes, destinations, tours, misc
lib/
  travel.ts         # typed destinations and tour package data
```

## Notes

- Static `<img>` tags are used (not `next/image`) to preserve the original's precisely
  tuned `object-fit` / absolutely-positioned image compositions. Swap to `next/image`
  later if you want automatic optimization.
- Motion is progressive: all content is visible without JS; animations only enhance.
  `prefers-reduced-motion` is fully respected (preloader hides immediately, no smooth scroll).
- The form is presentation-only, matching the original.
