# KaizenAI — Logo Snippet

Quick reference for getting the **KaizenAI** wordmark right. Source of truth is
[`components/Logo.tsx`](components/Logo.tsx) — just `import Logo from "@/components/Logo"`
and drop in `<Logo />`. Everything below is for recreating it elsewhere.

## Spec

| Property | Value |
| --- | --- |
| Font | **Syne**, weight **800 (ExtraBold)** |
| Tracking | `-0.03em` (tight) |
| "Kaizen" color | `#ECE5CF` (warm cream) |
| "AI" color | `#C8971C` (amber gold) |
| Default size | `text-2xl` |
| Casing | `Kaizen` + `AI` (capital K, capital A + I) |

## The snippet (copy-paste JSX)

```tsx
<span className="font-syne text-2xl font-extrabold tracking-[-0.03em] text-[#ECE5CF]">
  Kaizen<span className="text-[#C8971C]">AI</span>
</span>
```

## Font setup (required once per project)

**1. Load Syne via `next/font` in `app/layout.tsx`:**

```tsx
import { Syne } from "next/font/google";

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
});

// then on the html tag:
<html lang="en" className={syne.variable}>
```

**2. Register the family in `tailwind.config.ts`:**

```ts
theme: {
  extend: {
    fontFamily: {
      syne: ["var(--font-syne)", "system-ui", "sans-serif"],
    },
  },
}
```

> ⚠️ After **adding** a `next/font`, restart the dev server (`npm run dev`).
> HMR won't inject a newly-added font, so it'll silently fall back to system-ui
> until you restart.

## Plain HTML / CSS version (no Tailwind)

```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap" rel="stylesheet">

<span style="font-family:'Syne',sans-serif;font-weight:800;letter-spacing:-0.03em;color:#ECE5CF">
  Kaizen<span style="color:#C8971C">AI</span>
</span>
```
