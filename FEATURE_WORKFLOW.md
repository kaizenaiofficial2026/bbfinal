# Feature Workflow

How new features get built in this project. The goal is to stop "obvious things
getting overlooked" — a cart that's reachable by guests, a control that never
shows up in the admin panel, a form that crashes instead of showing an error.
The fix is not "be more careful"; it's a repeatable method that forces those
cases to the surface *before* code is written.

---

## The core idea: a requirements matrix

Most silent misses are a **combination that nobody enumerated** — a real actor
hitting a real surface in a real state. So before building, write the grid.

**Actors** (who is asking):

- Guest / not logged in
- Logged-in customer — pending admin approval
- Logged-in customer — verified/approved
- Second-level admin
- Super admin
- A bot (honeypot / rate-limit target)

**Surfaces × states** (where, in what condition):

- The page/route itself (direct URL, not just the link)
- The nav / entry point that reveals it
- Empty state, loading state, populated state
- Error state (network fails, validation fails, permission denied)
- Success state (and what resets afterward)

Fill one row per actor and answer, for each: **can they reach it? should they?
what do they see? what can they do?** The cells you leave blank are exactly the
bugs you'd otherwise ship. Example from the cart work:

| Actor | Can reach `/cart`? | Sees cart in their UI? | Cart data scope |
|---|---|---|---|
| Guest | ❌ redirect to login | ❌ | n/a |
| Customer | ✅ | ✅ header + floating | keyed per-user (`bb-cart:<id>`) |
| Admin | ✅ but n/a | ❌ never in admin chrome | n/a |

The two bugs that were fixed manually last time — guest access and cart leaking
across users — are both **empty cells in that grid**. Filling the grid first is
the whole point.

See `FEATURE_SPEC.md` for the blank template to copy per feature.

---

## The steps

### 1. Write the spec (matrix first)

Copy the `FEATURE_SPEC.md` template. Fill the actor × surface/state matrix.
List the explicit acceptance criteria that fall out of it. This is the contract
— if a cell isn't in the spec, it isn't built, and if it's in the spec it gets
tested.

### 2. Scout before writing

Find the existing pattern to mirror, don't invent a parallel one:

- **Auth gate?** — reuse `requireCustomer()`, `requireAdminUser()`,
  `requireSuperAdmin()`. Never re-implement a check inline.
- **A form?** — mirror an existing `*Form.tsx` + server action pair
  (validation via a Zod schema in `lib/validation/`, `SubmitButton` for
  pending state, `useToast()` for feedback).
- **A new admin control?** — it needs a nav entry (`AdminNav.tsx`, with
  `superOnly` if applicable) *and* the page *and* a server-side guard. All
  three, or it's half-built.

Grep for the closest existing feature and match its shape. Consistency is a
feature.

### 3. Enforce permissions on the server, always

The nav hiding a link is UX, not security. Every gated action re-checks on the
server:

- Page: `await requireSuperAdmin()` (or the right guard) at the top of the
  Server Component — a direct URL hit must redirect/deny.
- Action: the server action re-runs the guard *and* the business rule
  (`canToggleAdminActive`, etc.) before touching the DB. Never trust a hidden
  input or the client having hidden a button.

Two independent layers: **hide it in the UI** *and* **deny it on the server**.

### 4. Handle the unhappy path explicitly

For every action, decide what happens when it fails:

- Validation error → toast, not the error boundary. (A mismatched-password
  confirm should say so, not crash.)
- Permission denied → redirect or a clear message.
- Partial/duplicate submit → idempotency where it matters (bookings/orders).
- After success → what resets? (clear the form, refresh the list, sign out the
  affected session.)

Server actions return `{ ok, note }` so the client can branch instead of
throwing.

### 5. Keep the data scoped to its owner

Anything user-owned (cart, bookings, profile) is keyed by user id and relies on
RLS at the DB layer. When storing client-side, namespace by user
(`bb-cart:<userId>`) and clear it on user change so nothing leaks between
accounts.

### 6. Verify against the matrix — don't just build

Every acceptance cell gets checked:

- **Types/build:** `npx tsc --noEmit` and `npm run build` clean.
- **Unit:** `npx vitest run` — cover the pure guards/business rules
  (e.g. `tests/unit/admin-active.test.ts`).
- **Component:** the tricky client logic (e.g. per-user cart isolation).
- **E2E (Playwright):** the actor rows — a guest gets redirected, an admin
  never sees the customer surface, the gated route is behind login. Add the new
  route to the existing gating loop in `tests/e2e/admin.spec.ts`.
- **Visual parity** (when touching styling): screenshot before/after and diff;
  expect no perceptible change.

If a matrix cell can't be driven automatically (e.g. the logged-in super-admin
view with no test password), say so explicitly rather than claiming it's
verified.

### 7. Migrations are code

Schema changes are versioned migrations in `supabase/migrations/` (idempotent —
`add column if not exists`), applied to the live DB, and the change is reflected
in `lib/supabase/types.ts`. Never a manual dashboard edit that the repo doesn't
record.

### 8. Commit per logical unit

One feature = one focused commit with a message that says what it enables.
Keep it on the working branch so a regression is easy to bisect. Push only when
asked.

---

## The checklist (tl;dr)

Before calling a feature done:

- [ ] Matrix filled — every actor × surface/state cell has an answer
- [ ] Mirrors an existing pattern (guard / form / nav) rather than inventing one
- [ ] Server-side permission check on both the page and the action
- [ ] Failure path handled with a toast/message, not the error boundary
- [ ] User-owned data scoped by id + cleared on user change
- [ ] Nav entry exists if it's a new surface (with the right visibility)
- [ ] `tsc` + `build` + `vitest` green; E2E covers the actor rows
- [ ] Visual parity checked if styling changed
- [ ] Migration versioned + types updated if the schema changed
- [ ] Anything that *couldn't* be verified is called out, not glossed over

---

## Why this specifically prevents the overlooked-cases problem

The failures that hurt — guest reaching the cart, control missing from admin,
form crashing on bad input — are never *logic* bugs. They're **unenumerated
combinations**. The matrix makes enumeration a required, visible step, and the
verification section turns each enumerated cell into a test. You can't silently
skip a case you were forced to write down.
