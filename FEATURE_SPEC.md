# Feature Spec Template

Copy this file for every non-trivial feature **before writing code**. Filling the
matrix takes ~5 minutes and surfaces the "obvious" requirements that otherwise
live only in your head and get silently missed (e.g. "the cart was accessible to
guests", "it didn't show in the admin panel"). Every filled cell becomes a test.

> Rule of thumb: if a cell is blank, the behaviour is **undefined** — decide it now,
> don't discover it in production.

---

## 1. What & why
- **Feature:**
- **Goal (one sentence):**
- **Entry points / where it surfaces:** (public page, account page, admin panel, email, API, DB)

## 2. Actor × capability matrix
Fill every cell with the intended behaviour (✅ / ❌ / "shows X" / "redirect to Y").
Add/remove columns to fit the feature.

| Actor | Can see it | Can open/use | Can submit/mutate | Sees own data only | Shows in admin |
|---|---|---|---|---|---|
| **Guest** (not logged in) | | | | | |
| **Customer — unverified** (active, not approved) | | | | | |
| **Customer — verified** | | | | | |
| **Customer — deactivated** (active=false) | | | | | |
| **Admin** | | | | | |
| **Super-admin** | | | | | |

## 3. States (every screen/flow must define all of these)
- **Empty** (no data yet):
- **Loading / pending** (action in flight):
- **Error** (server/validation/network failure — what does the user see?):
- **Success**:
- **Partial / edge** (e.g. mixed cart, expired token, one item removed):

## 4. Data lifecycle
- **Create:** who, via which client (session/RLS vs service-role), what validation (Zod schema)?
- **Read:** is it RLS-enforced or a service-role query with a manual `user_id` filter?
- **Update / delete:** who, and what re-checks the guard?
- **On logout:** what happens to in-progress state?
- **On account delete:** is this data unlinked / removed / kept-as-record?
- **Cross-user isolation:** how is "user A can't see user B's data" guaranteed — RLS policy or code filter? (name it)

## 5. Surfaces & side effects
- **Admin visibility:** where does an admin see/manage this? (list page, detail page, status)
- **Emails / notifications triggered:**
- **Analytics / tracking:**
- **Payment / money involved?** (re-price server-side; never trust client amounts)

## 6. Responsive & i18n (for any UI)
- Verified at widths: **360 / 390 / 768 / 1024 / 1280 / 1440**
- No horizontal page overflow (wide content scrolls in its own container)
- **RTL** checked (`/ar`) — layout mirrors, fonts swap
- All user-facing strings are in `messages/*.json` (7 locales), not hardcoded

## 7. Security checklist
- [ ] Access guard centralised (one `requireX()` used by **every** entry point, not re-checked ad hoc)
- [ ] Server action / route validates input with Zod
- [ ] Rate-limited if it hits email/SMS/DB writes or auth
- [ ] Amounts/prices/IDs re-derived server-side, never taken from the client
- [ ] No secret/PII leaked to the client or logs

## 8. Definition of Done
- [ ] Matrix above fully filled and reviewed
- [ ] One **test per rule** (esp. the ❌ cells — "guest cannot…", "unverified cannot checkout")
- [ ] `lint` + `typecheck` + `test` + `test:e2e` green
- [ ] Smoke-tested on the preview deploy at 3 widths + `/ar`
- [ ] Happy path **and** one failure path exercised by hand
- [ ] Admin can see/manage it (if applicable)

---

### Worked example — Cart (the recurring blind spots, made explicit)

| Actor | See cart button | Open modal | Checkout | Shows in admin |
|---|---|---|---|---|
| Guest | ❌ | ❌ | ❌ | — |
| Customer — unverified | ✅ (if items) | ✅ | ❌ → "pending approval" | ✅ order visible |
| Customer — verified | ✅ (if items) | ✅ | ✅ | ✅ order visible |
| Customer — deactivated | ❌ (forced logout) | ❌ | ❌ | ✅ order visible |
| Admin | n/a | n/a | n/a | ✅ sees all orders/bookings |

The top-left `❌` is the rule that "cart is hidden from guests" — write it, and a guard
that returns `✅` is instantly a caught bug. The right-hand column is the "does it show
in admin" rule that's easy to forget entirely.
