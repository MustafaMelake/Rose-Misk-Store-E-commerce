# SYSTEM_ARCHITECTURE.md — Rose Misk Engineering Reference

> **Scope:** The server, database, security, validation, and admin/business-logic layers of the Rose Misk e-commerce app — the machinery beneath the journeys in [USER_JOURNEYS.md](./USER_JOURNEYS.md).
> **Stack (back-of-house):** Next.js 16.2.2 Server Actions & Server Components · Prisma 7.8 (`@prisma/adapter-pg` + `pg` Pool) · PostgreSQL on **Neon** · Better Auth 1.5.6 · Zod 3 · Vitest 4.
> **Verification status:** `npm run typecheck` (strict) → clean · `npx vitest run` → **60/60 passing**.

---

## 1. High-Level Topology

```
┌──────────────────────────── Browser (React 19 client) ────────────────────────────┐
│  ShopContext (cart/session/orders)   ·   admin client components   ·   Better Auth  │
│                                        │  client                                    │
└───────────────────────────────────────┼────────────────────────────────────────────┘
                                         │  Server Actions ("use server") + RSC fetches
┌────────────────────────────────────────▼───────────────────────────────────────────┐
│  src/proxy.ts (edge middleware)  — optimistic session-cookie routing                │
├──────────────────────────────────────────────────────────────────────────────────── │
│  Auth boundary:  requireUser() / requireAdmin()  (React-cached getCurrentUser)      │
├──────────────────────────────────────────────────────────────────────────────────── │
│  Validation boundary:  Zod schemas in src/lib/validations.ts                        │
├──────────────────────────────────────────────────────────────────────────────────── │
│  Data-access layer:  src/lib/actions/*.ts   (guarded, serialized, transactional)    │
├──────────────────────────────────────────────────────────────────────────────────── │
│  Prisma 7 client (singleton) ── @prisma/adapter-pg ── pg.Pool                        │
└────────────────────────────────────────┬───────────────────────────────────────────┘
                                         │  Postgres wire
                                ┌─────────▼─────────┐
                                │   Neon PostgreSQL  │
                                └────────────────────┘
```

**Layering principle — "auth and validation live next to the data."** No Server Component queries Prisma directly for privileged data; each privileged read/write is a function in `src/lib/actions/*` that begins with a guard and (for mutations) a Zod parse. This makes the authorization and validation checks impossible to skip, even under Partial Prerendering where a page may render in parallel with its layout.

---

## 2. Database & ORM

### 2.1 Neon PostgreSQL + Prisma 7 wiring

Prisma 7 talks to Neon through the **driver adapter** interface over a `pg` connection pool, instantiated as a global singleton so dev-mode hot reloads don't exhaust connections ([src/lib/prisma.ts](../src/lib/prisma.ts)):

```ts
const pool = new pg.Pool({ connectionString: `${process.env.DATABASE_URL}` });
const adapter = new PrismaPg(pool);
const prismaClientSingleton = () => new PrismaClient({ adapter });
export const prisma = globalThis.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
```

- CLI `prisma`, `@prisma/client`, and `@prisma/adapter-pg` are all aligned at **7.8.0** (version skew resolved in the refactor).
- `"postinstall": "prisma generate"` and `"build": "prisma generate && next build"` guarantee a generated client on fresh clones and in CI/build.

### 2.2 Data model (`prisma/schema.prisma`)

| Model | Purpose | Notable columns / rules |
|---|---|---|
| `Product` | Catalog item | `slug` unique + indexed; `rating`/`reviewsCount` **server-computed**; `categoryId` nullable |
| `ProductVariant` | A sellable volume | `price Decimal(10,2)`, `stock Int`; **unique `(productId, volume)`** |
| `Category` | Grouping | `name` unique |
| `Order` | A placed order | money as `Decimal(10,2)`; `status` enum + indexed; `userId` FK; `updatedAt` |
| `OrderItem` | Line in an order | `price` snapshot; **`variantId Int?` FK** (`onDelete: SetNull`) + `size` label |
| `CartItem` | Persisted cart line (auth users) | **unique `(userId, productId, size)`**; `variantId Int?` FK |
| `Review` | Product review | `rating Int`, **`comment String?` (nullable)**, `status` enum; **unique `(userId, productId)`** |
| `User` / `Session` / `Account` / `Verification` | Better Auth tables | `User.role` enum `USER`/`ADMIN`, default `USER` |

**Enums:** `OrderStatus` (`PENDING`, `AWAITING_PAYMENT`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `ReviewStatus` (`PENDING`, `APPROVED`, `REJECTED`), `Role` (`USER`, `ADMIN`).

**Money is `Decimal(10,2)` end-to-end** — in the schema and confirmed `numeric(10,2)` in the live Neon DB. All arithmetic uses `Prisma.Decimal`; values are serialized to plain `number` only at the action boundary, so client components receive JSON-safe data and no float drift occurs in pricing.

### 2.3 The `variantId` foreign key relationships (why they matter)

Both `OrderItem` and `CartItem` carry an explicit **`variantId Int?`** FK to `ProductVariant`, alongside the human-readable `size` string:

- **`OrderItem.variantId` (`onDelete: SetNull`):** an order permanently records which exact variant was purchased. If a variant's `volume` label is later renamed, the order's link survives, and **cancel-restock targets the variant by id** rather than by a stale `(productId, volume)` string. If the variant is deleted outright, the FK nulls out (order history is preserved) and the restock path logs the shortfall instead of silently crediting the wrong row.
- **`CartItem.variantId`:** lets a cart line resolve to a precise variant even across label edits.

This closes the pre-refactor hazard where restock/stock operations keyed only on `(productId, size-string)` would **silently no-op** after a rename.

### 2.4 Migration history — squashed baseline

The live DB had been shaped by `db push`, so the recorded migration history had diverged (float money columns, no `Review` table). It was rebaselined:

- `prisma/migrations_archive/` — the three original, now-superseded migrations (retained in git history).
- `prisma/migrations/20260716165910_baseline` — a single squashed baseline matching the true schema (Decimal money, all tables/enums, indexes). Marked applied on Neon via `migrate resolve --applied`.
- `prisma/migrations/20260716170500_schema_fixes` — nullable `Review.comment`; `variantId` FKs on `OrderItem`/`CartItem` (backfilled by `(productId, volume)` join); `Order.updatedAt` + `@@index([status])`; restored 5 indexes that `db push` drift had dropped.

`prisma migrate status` is clean; a fresh environment can now be built from history reproducibly.

---

## 3. Auth & Security Hardening

### 3.1 Better Auth configuration ([src/lib/auth.ts](../src/lib/auth.ts))

| Control | Setting | Why |
|---|---|---|
| Email verification | `requireEmailVerification: isEmailConfigured`, `sendOnSignUp: isEmailConfigured` | Closes the "register on a victim's email" takeover vector — **gated on a mailer existing** so it degrades gracefully instead of locking users out (see below) |
| Password reset | `emailAndPassword.sendResetPassword` | Mails a tokenized `/reset-password` link (English); no-ops with a warning if no mailer (G5) |
| Password policy | `minPasswordLength: 8`, `maxPasswordLength: 128` | Baseline credential hygiene |
| Role field | `additionalFields.role.type: ["ADMIN","USER"]`, **`input: false`** | Literal-array → strict `"ADMIN" \| "USER"` union; `input:false` blocks self-elevation at sign-up |
| Account linking | `trustedProviders: ["google","facebook"]` only | Auto-links only where the provider verifies the email |
| Rate limiting | `enabled`, `window: 60`, `max: 20` | Throttles brute force on auth endpoints |
| Trusted origins | localhost + `BETTER_AUTH_URL` + `NEXT_PUBLIC_BETTER_AUTH_URL` + `TRUSTED_ORIGINS` (de-duped) | CSRF origin allow-list |
| `nextCookies()` | **last** plugin | Correct `Set-Cookie` handling for auth flows via Server Actions |

Role typing was verified end-to-end (`session.user.role` is the strict union, not `any`) using `$Infer`/`inferAdditionalFields`, so guards can trust the role.

**Email graceful degradation (G7).** The Resend client and `isEmailConfigured`/`EMAIL_FROM`/`CONTACT_TO` live in one shared module, [src/lib/email.ts](../src/lib/email.ts), imported by both `auth.ts` and the contact action so "is email configured?" is decided in exactly one place. `isEmailConfigured = Boolean(resend)` is true only when `RESEND_API_KEY` is set. Verification is mandatory **only** when a mailer exists; otherwise `requireEmailVerification`/`sendOnSignUp` are `false`, so a new account is immediately usable rather than permanently un-signable-in. A startup `console.warn` flags the degraded mode, and the client screens read the optional `NEXT_PUBLIC_EMAIL_ENABLED` flag to show an honest "email inactive in this environment" note. The full user-facing flow (verify-email landing, resend, unverified-login recovery, forgot/reset) is documented in `USER_JOURNEYS.md §1.4`.

### 3.2 The `proxy.ts` session-cookie routing ([src/proxy.ts](../src/proxy.ts))

The middleware is deliberately **thin and optimistic**. It calls `getSessionCookie(request)` from `better-auth/cookies` — a pure cookie-presence check, **no DB round-trip, no self-fetch, no role decoding**:

```ts
const sessionCookie = getSessionCookie(request);
const isProtectedPage = path.startsWith("/admin")
  || path.startsWith("/orders") || path.startsWith("/placeorder");

if (!sessionCookie && isProtectedPage) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", path + request.nextUrl.search); // G14
  return NextResponse.redirect(loginUrl);
}
if (sessionCookie && isAuthPage) return NextResponse.redirect(new URL("/", request.url));
```

Matcher: `/login`, `/signup`, `/admin/:path*`, `/orders/:path*`, `/placeorder/:path*`. It handles the `__Secure-` cookie prefix automatically. Crucially, the middleware is a **UX redirect, not an authorization boundary** — a forged cookie passes the middleware but fails the real DB-backed guard downstream. The protected-route redirect preserves the intended path as `callbackUrl` (G14); `/login` sanitizes it (internal absolute paths only — protocol-relative and backslash forms are rejected to block open redirects) before returning the user there.

### 3.3 The guard layer ([src/lib/auth-guards.ts](../src/lib/auth-guards.ts))

```ts
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});
export async function requireUser()  { const u = await getCurrentUser(); if (!u) throw new AuthError(); return u; }
export async function requireAdmin() { const u = await requireUser(); if (u.role !== "ADMIN") throw new AuthError("…المسؤول…"); return u; }
```

- `getCurrentUser` is wrapped in **React `cache()`**, so a layout, its pages, and any actions in the same request share **one** `getSession` call.
- `PublicError`/`AuthError` are the only errors whose messages reach the client (all English); `toPublicMessage` masks everything else.

### 3.4 Guard coverage — the security matrix

| Surface | Guard | Notes |
|---|---|---|
| `admin/layout.tsx` | `getCurrentUser` → guest `redirect("/login?callbackUrl=/admin")`, non-admin `redirect("/unauthorized")` | Defense in depth (layout level); localized access-denied landing instead of a silent bounce (G15) |
| `admin/page.tsx` (dashboard) | `requireAdmin()` **before any fetch** | Data via guarded `getDashboardStats` |
| `admin/users/page.tsx` | `requireAdmin()` **before any fetch** | Data via guarded `getAdminUsers` |
| Other admin pages | Route data through `requireAdmin()`-guarded actions | `getAdminProducts`, `getAllOrders`, `getPendingReviews`, `getInventoryProducts`, `getTopSelling/RatedProducts` |
| `product/[id]/edit` | Layout + proxy; uses intentionally-public `getProductById` | No privileged data on the read path |
| UploadThing (`api/uploadthing/core.ts`) | `requireAdmin()` in `.middleware()` | Throws `UploadThingError("Unauthorized")` to reject the upload |
| All mutating actions | `requireUser` / `requireAdmin` at the top of the `try` | See §5 |

**No orphaned privileged surface:** every admin page either guards itself before fetching or fetches exclusively through a `requireAdmin()`-guarded action. Every mutation derives identity from the session, never from client input.

---

## 4. Validation & Action Layer

### 4.1 Centralized Zod schemas ([src/lib/validations.ts](../src/lib/validations.ts))

> Every exported function in a `"use server"` file is a **publicly invokable POST endpoint.** Validation therefore lives at the server boundary, never in the UI. TypeScript types are derived from the same schemas (`z.infer`), so the validated shape and the static type cannot drift.

| Schema | Guards against | Key rules |
|---|---|---|
| `orderInputSchema` | Malformed checkout | name 2–120, email, phone 6–30, **`governorate` ∈ `ALL_GOVERNORATES`** (trim-preprocessed enum), address 3–500, `paymentMethod` ∈ `{COD,CARD}` (upper-cased, default COD) |
| `orderItemsInputSchema` | Empty/oversized carts | non-empty array of `{ id>0, size 1–50, quantity 1..MAX_CART_QTY }` |
| `cartUpdateSchema` | Bad cart writes | `id>0`, `size 1–50`, **`quantity 0..20`** (0 = remove) |
| `cartMergeSchema` | Corrupt guest payloads | record-of-records; per-line quantity clamped to `[1,20]`; bad ids/sizes rejected |
| `reviewInputSchema` | Bad reviews | `id>0`, **integer `rating` 1–5** (English message), `comment` trimmed/optional ≤ 2000 |
| `variantInputSchema` | Bad money/stock | `volume ≤ 30`, **`price ≥ 0`, ≤ 99,999,999.99, ≤ 2 dp**, **`stock` integer ≥ 0** |
| `variantsInputSchema` | Duplicate variants | ≥ 1 variant; **duplicate volumes rejected** (case-insensitive) |
| `productCreateSchema` / `productUpdateSchema` | Bad product payloads | built on the variant schema; `images` must be HTTPS UploadThing URLs (`utfs.io` / `*.ufs.sh`), ≤ 8; **`rating` intentionally absent** |

**Negative-price / invalid-quantity / malformed-payload defenses are all schema-level** and shared, so the same rule can't be enforced in one action and forgotten in another.

### 4.2 Action inventory & their guards

| File | Action | Guard | Mutating? |
|---|---|---|---|
| `cart.actions.ts` | `getUserCart` | `requireUser` | read |
| | `updateCartInDB` | `requireUser` + `cartUpdateSchema` | ✅ |
| | `mergeCartAction` | `requireUser` + `cartMergeSchema` + txn | ✅ |
| `order.actions.ts` | `createOrder` | **`requireUser`** + order/items schemas | ✅ |
| | `getUserOrders` | `requireUser` | read |
| | `getAllOrders` | `requireAdmin` | read |
| | `updateOrderStatus` | `requireAdmin` + state machine | ✅ |
| `product.actions.ts` | `getAdminProducts` | `requireAdmin` | read |
| | `createProduct` / `updateProduct` / `deleteProduct` | `requireAdmin` + product schemas | ✅ |
| | `getProductById` / `getBestSellers` / `getLatestProducts` / `getAllProducts` / `searchProducts` | Public | read |
| | `getTopSellingProducts` / `getTopRatedProducts` / `getInventoryProducts` | `requireAdmin` | read |
| `review.actions.ts` | `submitReview` | `requireUser` + `reviewInputSchema` + delivered-purchase check | ✅ |
| | `approveReview` / `declineReview` / `getPendingReviews` | `requireAdmin` | ✅ / read |
| | `getApprovedProductReviews` | Public | read |
| `dashboard.actions.ts` | `getDashboardStats` | `requireAdmin` | read |
| `user.actions.ts` | `getAdminUsers` | `requireAdmin` | read |
| `category.actions.ts` | `getCategories` | Public (error masked) | read |
| `contact.actions.ts` | `sendContactMessage` | Public | `contactInputSchema` + Resend delivery |

### 4.3 The order-creation pipeline (the app's most safety-critical path)

`createOrder` ([src/lib/actions/order.actions.ts](../src/lib/actions/order.actions.ts)) is authenticated-only and treats **all** client input as untrusted:

1. **`requireUser()`** — guests are rejected here (aligned with the `/placeorder` middleware redirect). Identity is the session's, never the payload's.
2. **Validate** `orderInputSchema` + `orderItemsInputSchema`; invalid → returns `fieldErrors` (English, per order-input field) so the checkout form can render errors under the offending inputs (G11), no DB work.
3. **Normalize duplicates** — duplicate `(id, size)` lines are merged (quantities summed) via a `Map`, so a variant isn't stock-checked or created twice.
4. **Reject `CARD`** — no gateway is wired; an un-payable order is never created.
5. **Transaction:** for each line, look up the variant, then perform an **atomic conditional decrement**:
   ```ts
   const updated = await tx.productVariant.updateMany({
     where: { id: variant.id, stock: { gte: item.quantity } },
     data: { stock: { decrement: item.quantity } },
   });
   if (updated.count === 0) throw new InsufficientStockError("…غير متوفر بالكمية المطلوبة.");
   ```
   The stock check and the write are a **single statement**, so two shoppers cannot both buy the last unit; a failed guard rolls back the whole transaction. The dedicated `InsufficientStockError` (a `PublicError` subclass) makes the catch return `reason: "insufficient_stock"`, which the client uses to auto-reconcile the cart (G10).
6. **Server-side pricing** — the total is rebuilt from `Prisma.Decimal` variant prices + `calculateShippingFee(governorate)`. The client-supplied total is discarded.
7. **Persist** the order (`PENDING`) with the exact `variantId` per line, then delete **only the ordered** cart lines.
8. `revalidatePath("/orders")`.

**Structured result (`CreateOrderResult`).** `createOrder` returns `{ success, orderId?, message?, reason?, fieldErrors? }`. `fieldErrors` drives per-input checkout errors (G11); `reason: "insufficient_stock"` drives client cart reconciliation (G10). The success shape stays exactly `{ success: true, orderId }`.

---

## 5. Admin & Business Logic

### 5.1 Revenue — one canonical rule ([src/lib/revenue.ts](../src/lib/revenue.ts))

Revenue was previously defined inconsistently (dashboard counted `SHIPPED+DELIVERED`; top-sellers counted `PAID+SHIPPED+DELIVERED`). There is now a **single exported constant** that every revenue query imports — no inline status lists:

```ts
export const REVENUE_STATUSES: OrderStatus[] = ["PAID", "SHIPPED", "DELIVERED"];
```

- **`CANCELLED` (and the not-yet-paid `PENDING`/`AWAITING_PAYMENT`) are always excluded.**
- Consumers: `getDashboardStats` (KPI total + 6-month chart), `getTopSellingProducts` (both the `groupBy` unit ranking and the revenue `findMany`). The dashboard and the top-sellers page now report mutually consistent figures.

### 5.2 Dashboard KPIs ([src/lib/actions/dashboard.actions.ts](../src/lib/actions/dashboard.actions.ts))

`getDashboardStats` (guarded by `requireAdmin`) computes in parallel: total revenue (`REVENUE_STATUSES`), total order count (**excluding `CANCELLED`**), registered-`USER` count, and `PENDING`-fulfillment count, plus a 6-month revenue series for `RevenueChart`. All `Decimal` values are serialized to `number` at this boundary.

### 5.3 Customer lifetime spend ([src/lib/actions/user.actions.ts](../src/lib/actions/user.actions.ts))

`getAdminUsers` now scopes each user's included orders to `status: { not: "CANCELLED" }`, so both **order count** and **total spent** in the Customers table exclude cancelled orders — consistent with the dashboard and the revenue rule. A large cancelled order no longer inflates a customer's apparent spend.

### 5.4 Order status machine & idempotent cancel-restock

`updateOrderStatus` (`requireAdmin`) enforces a transition table with **terminal `DELIVERED` and `CANCELLED`**. Under the **COD-only lifecycle** (G2/G3) new orders never enter `AWAITING_PAYMENT`/`PAID` — those remain only as *source* keys so any historical order in them can still be moved forward or cancelled:

```
PENDING          → SHIPPED | DELIVERED | CANCELLED
SHIPPED          → DELIVERED | CANCELLED
DELIVERED        → ∅        CANCELLED → ∅
AWAITING_PAYMENT → SHIPPED | DELIVERED | CANCELLED   (legacy source only)
PAID             → SHIPPED | DELIVERED | CANCELLED   (legacy source only)
```

The admin order dropdown and status filter offer only `PENDING / SHIPPED / DELIVERED / CANCELLED`; a legacy order still in a removed state renders a matching read-only option so its `<select>` shows the real value.

Cancellation is **idempotent and race-safe**:

```ts
const res = await tx.order.updateMany({
  where: { id: orderId, status: { not: "CANCELLED" } },
  data: { status: "CANCELLED" },
});
if (res.count === 1) { /* only the call that actually cancelled restocks */
  for (const item of existingOrder.items) {
    const restock = await tx.productVariant.updateMany({
      where: item.variantId ? { id: item.variantId } : { productId: item.productId, volume: item.size },
      data: { stock: { increment: item.quantity } },
    });
    if (restock.count === 0) console.error(`[order ${orderId}] restock no-op …`); // renamed/deleted variant
  }
}
```

Two concurrent cancellations can't both restock (the conditional flip yields `count === 1` exactly once); restock keys on the precise `variantId` (falling back to `(productId, volume)` for legacy rows) and **logs** any no-op rather than silently losing units.

### 5.5 Review moderation & rating aggregation

`submitReview` requires a `DELIVERED` purchase and enforces one review per `(userId, productId)`; comment is optional (nullable column). Reviews enter `PENDING`. On `approveReview` (`requireAdmin`), within a transaction the product's `rating` (mean of approved ratings, 1-dp) and `reviewsCount` are recomputed — **ratings are exclusively server-derived** and never accepted from client input (the `productCreateSchema` deliberately omits `rating`).

---

## 6. Testing & Verification

- **Vitest suites** (`src/lib/actions/*.test.ts`): cart, category, order, product, review — **60 tests, all passing**. Prisma, auth guards, `next/cache`, and shipping are mocked; the real `ALL_GOVERNORATES` export backs the governorate enum.
- **Coverage of the fixes:** atomic decrement failure, CARD rejection, **guest-checkout rejection** (new), variant-id restock, restock no-op logging, terminal-state rejection, nullable-comment review, out-of-range rating, duplicate review, revenue-status filtering.
- **Type safety:** `"strict": true`; `npm run typecheck` is clean.
- **Scripts:** `dev`, `build` (`prisma generate && next build`), `start`, `postinstall`, `lint` (`eslint .`), `typecheck`, `test` / `test:ui`.

---

## 7. Known Gaps & Future Tech Debt

The commerce engine (auth, validation, pricing, stock, orders, revenue, reviews) is cohesive and gap-free as of this cycle. The following are **non-blocking** structural/quality items deferred to the next cycle, carried forward from the Phase 4 checklist in [REFACTOR_PLAN.md](./REFACTOR_PLAN.md). None represents a security hole or a data-integrity risk in current usage.

> **Phase 6 — UI/UX Realignment (Cross-Document Audit follow-up).** All 15 audit gaps (G1–G15) closed across three batches. ✅
> **Batch 1 — DONE:** G5 (forgot/reset password), G7 (email-verification journey + graceful degradation), G14 (login return-path), G15 (localized `/unauthorized`).
> **Batch 2 — DONE:** G1 (live order-status refresh on `/orders`), G2/G3 (removed unreachable `AWAITING_PAYMENT`/`PAID` from admin controls + state machine), G6 (COD-only payment UI), G12 (`/order-confirmation/[id]` receipt page).
> **Batch 3 — DONE:** G4 (contact form → real Resend-backed `sendContactMessage`), G10 (checkout-time cart reconciliation), G11 (field-level checkout errors), G13 (stock-ceiling feedback on product + cart pages), G8 (deleted `clearUserCart`), G9 (dead guest branch removed — completed in Batch 2).

### 7.1 DTO / serialization honesty (Medium)
- `serializeProduct<T>()` returns `... as T` — the static type still claims `Decimal` while the runtime value is `number`. `ShopContext` compensates with `as unknown as Product[]`.
- **Debt:** introduce explicit DTOs in `src/types/` (`SerializedProduct`, `SerializedVariant { price: number }`, `SerializedOrder`…), make `serializeProduct` return them, and delete the casts.

### 7.2 `getInventoryProducts` returns raw `Decimal` (Medium)
- The admin stock page is a Server Component that calls `Number(variant.price)` at render, so it's safe **today**. But the action leaks `Prisma.Decimal` across its boundary — a latent landmine if a client component ever consumes it.
- **Debt:** serialize `Decimal → number` at the action boundary like every other action.

### 7.3 Inverted type dependency: server imports from a client module (Low)
- `src/lib/actions/cart.actions.ts` imports the `CartItems` type from `@/context/ShopContext` (a `"use client"` module). Type-only today, but the dependency direction is wrong.
- **Debt:** move `CartItems` and other shared types into `src/types/`; server actions import types only from there.

### 7.4 `ShopContext` scale & ergonomics (Medium)
- Fetches the whole catalog client-side (`getAllProducts(1, 100)`) on every visitor mount; the context `value` object is rebuilt each render (re-renders all consumers); `DeliveryData` still carries US-template field names (`state`/`zipcode`/`country`) remapped to governorate.
- **Debt:** server-render/paginate the catalog, memoize the context value, and rename the delivery fields to the Egyptian model.

### 7.5 `/orders` signed-out UX (Low)
- The middleware correctly redirects guests away from `/orders`; there is no dedicated friendly signed-out empty state (not reachable in normal flow).
- **Debt:** add a friendly signed-out state for completeness.

### 7.6 Test breadth (Low)
- Present: guest-rejection, restock, nullable comment, rating bounds, revenue-status filter. Still worth adding as explicit, data-driven cases: invalid-quantity and negative-price schema rejections, and a fixture-driven cancelled-order revenue-exclusion assertion.

### 7.7 Prisma generator migration (Low, time-boxed)
- Still on the legacy `prisma-client-js` generator. Prisma 8 will drop it.
- **Debt:** move to the new `prisma-client` generator (`output = "../src/generated/prisma"`, already git-ignored) before upgrading to Prisma 8.

### 7.8 CI & full build gate (Medium)
- No GitHub Actions pipeline yet; `next build`, `eslint`, and a Playwright smoke test have not been wired as an automated gate (unit tests + typecheck are green locally).
- **Debt:** add CI — install → `prisma generate` → `typecheck` → `lint` → `vitest` → `next build` → optional Playwright smoke (config already present).

---

### Appendix — File Reference

| Concern | File |
|---|---|
| Middleware routing | [src/proxy.ts](../src/proxy.ts) |
| Auth config | [src/lib/auth.ts](../src/lib/auth.ts) |
| Guards & error masking | [src/lib/auth-guards.ts](../src/lib/auth-guards.ts) |
| Zod schemas | [src/lib/validations.ts](../src/lib/validations.ts) |
| Canonical revenue rule | [src/lib/revenue.ts](../src/lib/revenue.ts) |
| Currency & date formatting | [src/lib/format.ts](../src/lib/format.ts) |
| Shipping fees | [src/lib/shipping.ts](../src/lib/shipping.ts) |
| Prisma singleton | [src/lib/prisma.ts](../src/lib/prisma.ts) |
| Schema & migrations | [prisma/schema.prisma](../prisma/schema.prisma), [prisma/migrations/](../prisma/migrations/) |
| Server actions | [src/lib/actions/](../src/lib/actions/) |
| Client store | [src/context/ShopContext.tsx](../src/context/ShopContext.tsx) |
| Auth-edge routes (Phase 6 · Batch 1) | [verify-email](../src/app/(shop)/verify-email/page.tsx), [forgot-password](../src/app/(shop)/forgot-password/page.tsx), [reset-password](../src/app/(shop)/reset-password/page.tsx), [unauthorized](../src/app/(shop)/unauthorized/page.tsx) |
| Commerce-UX (Phase 6 · Batch 2) | [order-confirmation](../src/app/(shop)/order-confirmation/[id]/page.tsx), [revenue rule](../src/lib/revenue.ts), `refreshOrders` in [ShopContext](../src/context/ShopContext.tsx) |
| Forms & resilience (Phase 6 · Batch 3) | [email.ts](../src/lib/email.ts), [contact.actions.ts](../src/lib/actions/contact.actions.ts), `reconcileCartWithStock` in [ShopContext](../src/context/ShopContext.tsx), `CreateOrderResult` in [order.actions.ts](../src/lib/actions/order.actions.ts) |
