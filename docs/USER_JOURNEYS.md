# USER_JOURNEYS.md — Rose Misk Storefront & Interface Logic

> **Scope:** Every customer- and admin-facing touchpoint of the Rose Misk e-commerce app, mapped to the code that powers it.
> **Stack (front-of-house):** Next.js 16.2.2 (App Router, React 19 Server + Client Components) · Better Auth 1.5.6 · client `ShopContext` · Tailwind CSS 4 · `react-toastify` · `framer-motion`.
> **Audience:** Arabic-first (Egypt). All money renders as `ar-EG` EGP; all dates render as `ar-EG`; all user-facing error/status strings are Arabic.
> **Companion doc:** [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) covers the server, database, and security layers each journey below depends on.

---

## 0. Route Map & Access Model

| Route | Type | Access | Guard(s) |
|---|---|---|---|
| `/` (home) | Public | Everyone | — |
| `/fragrances` | Public | Everyone | — |
| `/product/[id]` | Public | Everyone | — |
| `/cart` | Public | Everyone (guest cart in `localStorage`) | — |
| `/about`, `/contact` | Public | Everyone | — |
| `/login`, `/signup` | Public | Signed-out only | `proxy.ts` redirects signed-in users → `/` |
| `/verify-email` | Public | Everyone | — (post-signup landing + resend) |
| `/forgot-password`, `/reset-password` | Public | Everyone | — (Better Auth reset flow) |
| `/unauthorized` | Public | Everyone | — (RBAC access-denied landing) |
| `/order-confirmation/[id]` | Public | Everyone (details owner-scoped) | — (post-checkout receipt; shows details only for the viewer's own order) |
| `/placeorder` | Protected | Authenticated | `proxy.ts` cookie check → `/login?callbackUrl=…`; `createOrder` re-checks `requireUser()` |
| `/orders` | Protected | Authenticated | `proxy.ts` cookie check → `/login?callbackUrl=…`; `getUserOrders` re-checks `requireUser()` |
| `/admin/**` | Protected | `ADMIN` only | `proxy.ts` + `admin/layout.tsx` (guest → `/login?callbackUrl=/admin`; non-admin → `/unauthorized`) + per-page/per-action `requireAdmin()` |

The **middleware** ([src/proxy.ts](../src/proxy.ts)) performs an *optimistic* cookie check only — it never trusts it as authorization. The real boundary is always the server-side guard in the action or page (see the architecture doc, §Auth). This is why `/placeorder` is protected at **two** layers: the middleware redirect for UX, and `requireUser()` inside `createOrder` for security. When the middleware bounces a guest off a protected route, it appends the intended path as `?callbackUrl=…` so login can return them there (see §1.4).

---

## 1. Customer Flows

### 1.1 Product Browsing & Discovery

**Entry points:** home page (`/`), the full catalog (`/fragrances`), or a direct product link.

1. **Home (`/`)** renders featured/latest merchandising:
   - `BestSeller` calls the public `getBestSellers()` action (products where `isFeatured = true`, capped at 5).
   - `LatestCollection` calls `getLatestProducts()` (most recent 10 by `createdAt`).
   - Each product card is a `ProductItem`, which now derives its own price display via `formatCurrency(price)` — the parent no longer passes a `currency` prop.
2. **Catalog (`/fragrances`)** reads the full product list from `ShopContext` (loaded once per mount via `getAllProducts(1, 100)`), then applies **client-side** category, subcategory, sort, and pagination. Categories come from `getCategories()`.
3. **Search** — the `SearchBar` overlay (toggled by `searchOpen` in `ShopContext`) calls `searchProducts(query)`. The query is server-clamped to 100 characters and matches name/description (case-insensitive), returning at most 8 results.
4. **Product detail (`/product/[id]`)** is a **Server Component** that awaits `getProductById(id)`:
   - Invalid/non-numeric id → `{ success: false, error: "معرّف المنتج غير صالح." }` → the page calls `notFound()`.
   - Valid product → renders `ProductDetails` (variant/volume selector, price via `formatCurrency`, stock-aware "Add to Cart") plus `ProductReviews` (approved reviews only).
   - The action includes **only `APPROVED`** reviews with the reviewer's name/image; pending and rejected reviews never reach the storefront.

**Price display contract:** every storefront price — cards, detail page, cart, checkout, order history — flows through `formatCurrency` from [src/lib/format.ts](../src/lib/format.ts), producing `ar-EG` EGP output (e.g. `‏١٬٢٣٤٫٥٠ ج.م.‏`). There is a single formatter; no component concatenates a currency string of its own.

---

### 1.2 Cart Management

The cart is a `Record<productId, Record<size, quantity>>` held in `ShopContext`. Its behaviour differs by auth state, and the two states are reconciled at login by the **merge** logic.

#### Guest cart (signed-out)
- Lives entirely in `localStorage` under the key `rose_misk_cart`.
- On every cart mutation, an effect serializes the cart back to `localStorage` (or removes the key when empty).
- **Robustness (hardened):** cart initialization reads `localStorage` inside a `try/catch`. If the stored value is missing, not valid JSON, or not a plain object (e.g. an array or a primitive from a corrupted write), the bad value is discarded and the cart starts empty instead of throwing and breaking hydration.

```ts
// src/context/ShopContext.tsx — defensive parse
let localCart: CartItems = {};
try {
  const localData = localStorage.getItem("rose_misk_cart");
  const parsed = localData ? JSON.parse(localData) : {};
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    localCart = parsed;
  } else {
    localStorage.removeItem("rose_misk_cart");
  }
} catch {
  localStorage.removeItem("rose_misk_cart");
}
```

#### Authenticated cart (signed-in)
- Persisted server-side in the `CartItem` table, keyed by the unique triple `(userId, productId, size)`.
- Reads via `getUserCart()`; writes via `updateCartInDB(productId, size, quantity)`.
- Every write is Zod-validated (`cartUpdateSchema`) and identity comes from the session — a client cannot write to another user's cart.

#### Add / update / remove semantics
- **Add** (`addToCart`): optimistic client update, capped by the loaded variant `stock` (if the variant is loaded; if not, the server still enforces stock at checkout). When signed in, it mirrors the new quantity to the DB.
- **Update** (`updateQuantity`): quantity `≤ 0` removes the line; otherwise the requested quantity is clamped to available stock. Signed-in users mirror the final quantity to the DB.
- **Server clamp:** `updateCartInDB` accepts `quantity` in `[0, MAX_CART_QTY]` (20). `0` deletes the line; anything higher is rejected by the schema.
- **Stock-ceiling feedback (G13):** hitting the stock limit is no longer a silent no-op. The product page (`ProductDetails`) shows *"الحد المتاح N قطعة فقط في المخزون"* when a further "Add" would exceed stock, and the cart page shows an amber notice when the "+" button is capped.

#### Checkout-time reconciliation (G10)
If stock drops between adding to cart and checking out, `createOrder` fails with `reason: "insufficient_stock"`. `ShopContext.placeOrder` then calls `reconcileCartWithStock()`: it pulls fresh product stock, **clamps every cart line to what's actually available** (dropping now-unavailable lines), and syncs the DB cart for signed-in users. The shopper sees *"…وتم تحديث سلتك…"* and can immediately retry with a valid cart instead of being stuck.

#### The merge & duplicate-handling logic (login reconciliation)
When a guest signs in with items already in their `localStorage` cart, `ShopContext` runs `mergeCartAction(localCart)` **before** loading the server cart:

1. The entire guest payload is validated against `cartMergeSchema` (record-of-records shape; each quantity coerced into `[1, MAX_CART_QTY]`; malformed ids/sizes rejected wholesale).
2. All upserts run inside **one Prisma `$transaction`**, so a failure can never leave the cart half-migrated.
3. For each `(productId, size)`, the quantity is **incremented** onto any existing server line (duplicate handling: a guest's 2× + an existing 1× server line becomes 3×), or a new line is created.
4. After merging, a single `updateMany` **caps** every line at `MAX_CART_QTY`, so the increment can't push a line past the hard limit.
5. The `localStorage` cart is cleared, and the freshly merged server cart is loaded into context.

The net effect: **no items are silently lost at login**, duplicates are summed rather than overwritten, and no line can exceed the 20-unit ceiling.

---

### 1.3 Checkout

**Precondition:** checkout requires authentication. A guest who reaches `/placeorder` is redirected to `/login?callbackUrl=/placeorder` by the middleware (returning them to checkout after sign-in, §1.4), and even a direct `createOrder` call is rejected server-side.

1. **`/placeorder`** renders the delivery form and a live order summary. Selecting a governorate recomputes the shipping fee client-side via `calculateShippingFee` (Cairo/Giza = 75, Upper Egypt = 115, everywhere else = 85 EGP). Until a governorate is chosen, the fee area shows `اختر المحافظة` ("choose the governorate"); once chosen it renders `formatCurrency(fee)`.
2. **Payment method:** `COD` (Cash on Delivery) is the **only** method — presented as a fixed method card, not a choice (G6). No `CARD` option exists in the UI. `createOrder` still defensively rejects a directly-POSTed `CARD` payload, so no un-payable order can be created out-of-band.
3. **Submit** → `ShopContext.placeOrder()` flattens the cart into `{ id, size, quantity }[]`, builds the order payload, and calls `createOrder(orderPayload, items)`.
4. **Server truth (see architecture doc §Order Pipeline for detail):** the client-supplied total is **ignored**. The server re-derives prices from the DB, atomically decrements stock per variant, applies the shipping fee, and creates the order at status `PENDING`. Only the cart lines that were actually ordered are deleted — a partial checkout leaves the rest of the cart intact.
5. **Result:**
   - Success → `{ success: true, orderId }`. The context clears the cart, refreshes order history, and the shopper is redirected to **`/order-confirmation/[orderId]`** — a durable receipt page (order number, date, item count, total) with links to track orders or keep shopping (G12). This replaced the old transient `alert()`.
   - Failure → surfaced **inline** (no more `alert`): a form-level banner plus per-field messages under the offending inputs (G11), driven by the server's structured `{ message, fieldErrors, reason }`.
     - **Validation failure** → `fieldErrors` (Arabic, keyed by `customerName` / `customerEmail` / `customerPhone` / `governorate` / `address`) render under the matching inputs.
     - **Insufficient stock** (`reason: "insufficient_stock"`) → the cart is **auto-reconciled** to available stock before the message shows, so the shopper isn't stuck (G10; see §1.2).

**Guest-checkout cohesion note:** the earlier ambiguity (server allowed `null` users while the middleware blocked `/placeorder`) is resolved — `createOrder` now begins with `requireUser()`, so the authenticated-only intent is enforced identically at the UI redirect layer and the server action layer.

---

### 1.4 Account Lifecycle — sign-up, verification, password recovery & return paths

This section covers the authentication edges (added in Phase 6, Batch 1). All screens are Arabic-first, RTL.

#### Sign-up → email verification
1. `/signup` calls `authClient.signUp.email(...)`. On success the user is routed to **`/verify-email?email=…`** (no longer dumped silently on the home page).
2. `/verify-email` reconciles two realities using the live session:
   - **Verification required** (a mailer is configured) → sign-up created **no** session → the page shows a *"check your inbox"* state for `{email}` with a **Resend** button (`authClient.sendVerificationEmail`).
   - **Verification not required** (no mailer configured — see the graceful-degradation note below) → sign-up already created a session → the page shows an *"account ready"* state with links to the store and to `/orders`.
3. Clicking the link in the email verifies the address and (via `autoSignInAfterVerification`) signs the user in, landing them back on `/verify-email` in the "account ready" state.

#### Graceful degradation when email isn't configured
The system **never silently locks a user out**. If `RESEND_API_KEY` is absent, mandatory verification is switched **off** at the server (`requireEmailVerification` is gated on the mailer existing), so a freshly-registered account is immediately usable. `/verify-email` and `/forgot-password` additionally read the optional `NEXT_PUBLIC_EMAIL_ENABLED` flag; when it is `"false"` they display a clear localized note that email delivery is inactive in this environment, rather than promising a mail that will never arrive.

#### Login "email not verified" recovery
When a mailer *is* configured and a user tries to sign in before verifying, `/login` distinguishes the Better Auth `EMAIL_NOT_VERIFIED` / `403` case from bad credentials: it shows *"لم يتم تأكيد بريدك الإلكتروني بعد…"* plus a **"تأكيد البريد الإلكتروني"** link back to `/verify-email?email=…`. Genuine credential errors still show the generic *"البريد الإلكتروني أو كلمة المرور غير صحيحة"*.

#### Forgot / reset password
1. The `/login` "Forgot?" link now resolves to **`/forgot-password`** (previously a 404).
2. `/forgot-password` calls `authClient.requestPasswordReset({ email, redirectTo: "/reset-password" })`. To prevent account enumeration, the UI **always** shows the same *"check your inbox"* confirmation regardless of whether the address exists.
3. The emailed link opens **`/reset-password?token=…`**, which validates the two password fields (≥ 8 chars, matching), calls `authClient.resetPassword({ newPassword, token })`, then redirects to `/login?reset=success`. An absent/invalid token shows a localized *"رابط غير صالح"* state with a link back to request a new one.
4. `/login?reset=success` renders a green *"تم تحديث كلمة المرور بنجاح…"* banner.

#### Return-path (`callbackUrl`) after a login wall
When the middleware bounces a guest off a protected route, it appends `?callbackUrl=<original-path>`. On successful sign-in (email **or** social), `/login` reads that param, **sanitizes it** (only internal absolute paths are accepted — protocol-relative `//host` and backslash tricks are rejected to prevent open redirects), and returns the user there instead of always dumping them on `/`. A guest who clicks "My Orders" now lands back on `/orders` after logging in.

#### RBAC boundary landing
A signed-in **non-admin** who hits any `/admin/**` route is redirected by `admin/layout.tsx` to the localized **`/unauthorized`** page (explanation + CTAs to the store and to `/orders`) — no longer a silent bounce to `/`. A **guest** hitting `/admin/**` is sent to `/login?callbackUrl=/admin`.

### 1.5 Contact

The `/contact` form is now backed by a real server action (G4) — it no longer `console.log`s and fakes a success alert. Submitting calls `sendContactMessage(formData)`, which validates the payload (`contactInputSchema`: name, reply-to email, message) and delivers it to the store inbox (`CONTACT_TO`) via Resend, with the visitor's address set as `replyTo`. The form shows a genuine success or error state:
- **Delivered** → *"تم إرسال رسالتك بنجاح! سنتواصل معك قريباً."*
- **No mailer configured** → an honest *"خدمة إرسال الرسائل غير متاحة حالياً…"* directing the visitor to WhatsApp/email, rather than a false "sent" confirmation.

---

## 2. UI & Localization (i18n)

### 2.1 Currency — `formatCurrency` (`ar-EG` / EGP)

[src/lib/format.ts](../src/lib/format.ts) is the **single source of truth** for money across both the storefront and the admin dashboard:

```ts
export function formatCurrency(value: number | string): string {
  const n = Number(value);
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(Number.isFinite(n) ? n : 0);
}
```

- **Non-finite guard:** `NaN`/`Infinity`/garbage input renders as `0` formatted, never `"NaN ج.م."`.
- **Coverage:** product cards (`ProductItem`), product detail, cart line totals, `CheckOut` summary, `/placeorder` summary, `/orders` history, and the admin surfaces (dashboard KPI, orders table, stock table, top-sellers, customers table, revenue chart tooltip/axis). The old ad-hoc `formatPrice` (en-US) helper and the hardcoded `"EGP "` context string have been fully removed.
- **Chart exception:** `RevenueChart` uses a local compact `ar-EG` formatter with `maximumFractionDigits: 0` for axis ticks (whole-EGP labels), and `formatCurrency` for the precise tooltip value.

### 2.2 Dates — `formatDate` (`ar-EG`)

The same module provides one date formatter, replacing every hardcoded `en-GB`/`en-US`/default-locale call:

```ts
export function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
```

Used by order history (via `getUserOrders`, formatted server-side), the admin orders table, the admin customers "Joined Date", the admin review list, and the storefront `ProductReviews` list.

### 2.3 Error handling — Arabic-first via `toPublicMessage`

All server actions catch internally and return `{ success, message | error }`; they never throw raw errors to the client. The normalizer lives in [src/lib/auth-guards.ts](../src/lib/auth-guards.ts):

```ts
export function toPublicMessage(
  error: unknown,
  fallback = "حدث خطأ غير متوقع. برجاء المحاولة مرة أخرى."
): string {
  return error instanceof PublicError ? error.message : fallback;
}
```

- **Safe passthrough:** only `PublicError` subclasses (business rules, `AuthError`) surface their own message. Everything else (DB failures, bugs) is masked behind the Arabic generic fallback — no stack traces or raw DB strings leak.
- **Arabic-first strings** the shopper can encounter:

| Situation | Message |
|---|---|
| Not signed in | `غير مصرّح: يجب تسجيل الدخول أولاً.` |
| Not an admin | `غير مصرّح: هذه العملية تتطلب صلاحيات المسؤول.` |
| Invalid order details | `بيانات الطلب غير صالحة. برجاء مراجعة معلوماتك.` |
| Card payment attempted | `الدفع بالبطاقة غير متاح حالياً. برجاء اختيار الدفع عند الاستلام.` |
| Out of stock at checkout | `المنتج ذو الحجم {size} غير متوفر بالكمية المطلوبة.` |
| Order placement failed (fallback) | `تعذّر إتمام طلبك. برجاء المحاولة مرة أخرى.` |
| Rating out of range | `التقييم يجب أن يكون بين 1 و 5.` |
| Review without a delivered order | `يمكنك تقييم المنتجات من الطلبات التي تم توصيلها فقط.` |
| Duplicate review | `لقد قمت بتقييم هذا المنتج من قبل.` |
| Review submitted | `تم إرسال تقييمك وهو قيد مراجعة الإدارة.` |

> **Note:** the ReviewModal component already presented Arabic copy to the user; the server layer is now aligned with it, so the message a shopper sees is Arabic regardless of whether it originates in the component or bubbles up from the action.

---

## 3. State Management — the client `ShopContext`

[src/context/ShopContext.tsx](../src/context/ShopContext.tsx) is the single client-side store wrapping the storefront. It coordinates three sources of truth: **React state**, **`localStorage`** (guests), and the **server** (authenticated users).

### 3.1 Responsibilities
- **Products:** fetched once per mount (`getAllProducts(1, 100)`) and exposed to all consumers.
- **Session awareness:** subscribes to `authClient.useSession()`; `userId` drives every guest-vs-authenticated branch.
- **Cart lifecycle:** initialize → (merge on login) → mutate → persist.
- **Orders:** `userOrders` is loaded via `getUserOrders()` whenever `userId` changes, and refreshed after a successful checkout.
- **Derived values:** `subtotal` and `getCartCount` are memoized over `cartItems` (and `products` for pricing).
- **Helpers:** `getPriceBySize`, `addToCart`, `updateQuantity`, `goToCheckout`, `placeOrder`.

### 3.2 The reconciliation state machine

```
                 ┌─────────────── guest (no userId) ───────────────┐
   mount ──▶ read localStorage (guarded parse) ──▶ setCartItems(local)
                 │                                                   │
                 │   mutate ──▶ setCartItems ──▶ effect writes localStorage
                 └───────────────────────────────────────────────────┘

                 ┌──────────── sign-in transition (userId set) ─────┐
   userId ──▶ if localStorage cart non-empty:                       │
             clear localStorage ──▶ mergeCartAction(local)          │
             ──▶ getUserCart() ──▶ setCartItems(server)             │
                 └───────────────────────────────────────────────────┘

                 ┌──────────── authenticated (userId) ─────────────┐
   mutate ──▶ setCartItems (optimistic) ──▶ updateCartInDB(...)     │
                 └───────────────────────────────────────────────────┘
```

- The `localStorage`-persist effect is **gated on `!userId`**, so authenticated mutations never write to `localStorage` (the DB is authoritative for signed-in users). `isCartLoaded` prevents the persist effect from firing before initialization completes and wiping a good stored cart.
- Optimistic updates give instant UI feedback; the server write follows and is the enforcement point for stock and validation.

---

## 4. Order Lifecycle — the Client's View

Orders are created at `PENDING` and move through a server-enforced state machine (full transition table in the architecture doc). Under the **COD-only lifecycle** an order travels `PENDING → SHIPPED → DELIVERED`, with `CANCELLED` reachable from any non-terminal state. `AWAITING_PAYMENT` and `PAID` are **legacy** payment-gateway states that new orders can no longer enter and that the admin can no longer set (G2/G3); the customer view keeps a defensive label for them only so any historical order still renders. Status labels are humanized in the UI (`formatStatus`), amounts use `formatCurrency`, and dates use `formatDate`.

| Status | Customer sees | Meaning | Can review? |
|---|---|---|---|
| `PENDING` | Amber dot · "Pending" | Order placed (COD), awaiting processing | No |
| `SHIPPED` | Blue dot · "Shipped" | On its way | No |
| `DELIVERED` | Green dot · "Delivered" | Received — **unlocks reviewing** | **Yes** |
| `CANCELLED` | Red dot · "Cancelled" | Cancelled; stock restocked server-side | No |
| `AWAITING_PAYMENT` / `PAID` | (legacy) Amber/Green dot | Only on historical orders; unreachable for new ones | No |

Each order card shows its number, `formatDate(createdAt)`, per-item name/image/size/quantity/price, the shipping fee (when > 0), the payment method, and the grand total — all currency via `formatCurrency`.

**Live status visibility (G1).** `/orders` no longer shows a stale snapshot. `ShopContext` exposes a memoized `refreshOrders()`, and the page refetches on **mount**, on **window focus / tab visibility**, and on a light **30-second interval** while open. So when an admin flips an order to `SHIPPED`/`DELIVERED`/`CANCELLED`, the customer sees it without a manual reload.

### 4.1 The review submission process (client view)

Reviewing is gated on a **delivered purchase** and is one-review-per-product-per-user:

1. On `/product/[id]`, a signed-in shopper opens the **`ReviewModal`** (Arabic RTL: star picker + optional comment, max 500 chars in the textarea).
2. Submitting calls `submitReview({ productId, rating, comment })`.
3. The server (`submitReview`) validates the payload (`reviewInputSchema`: integer rating 1–5, comment trimmed/optional up to 2000 chars), then confirms the user has a `DELIVERED` order containing that product. If not: `يمكنك تقييم المنتجات من الطلبات التي تم توصيلها فقط.`
4. **Comment is optional** — an empty comment is stored as SQL `NULL` (the `Review.comment` column is nullable), so a rating-only review succeeds. (This was previously a runtime failure; it is now correct and regression-tested.)
5. The review is created with status `PENDING`. The shopper sees `تم إرسال تقييمك وهو قيد مراجعة الإدارة.` — it is **not** visible on the product page until an admin approves it.
6. A duplicate submission (unique `(userId, productId)`) returns `لقد قمت بتقييم هذا المنتج من قبل.`
7. On approval, the product's aggregate `rating` and `reviewsCount` are recomputed server-side, and the review joins the public list on the product page.

---

## 5. Journey → Server Action Traceability

Every customer interaction resolves to a Zod-validated, guarded server action. This table is the storefront half of the cohesion check (the server half is in the architecture doc).

| User interaction | Action | Guard | Validation |
|---|---|---|---|
| Browse home merch | `getBestSellers` / `getLatestProducts` | Public | — (read-only) |
| Browse catalog | `getAllProducts` | Public | pagination clamped (`page ≥ 1`, `limit ≤ 48`) |
| Search | `searchProducts` | Public | query trimmed, ≤ 100 chars |
| View product | `getProductById` | Public | numeric-id check; only `APPROVED` reviews returned |
| Load categories | `getCategories` | Public | error masked via `toPublicMessage` |
| Add/update cart (auth) | `updateCartInDB` | `requireUser` | `cartUpdateSchema` |
| Load server cart | `getUserCart` | `requireUser` | — (read-only) |
| Merge guest cart at login | `mergeCartAction` | `requireUser` | `cartMergeSchema` + per-line clamp + txn |
| Place order | `createOrder` | `requireUser` | `orderInputSchema` + `orderItemsInputSchema`; server-side pricing/stock |
| View order history | `getUserOrders` | `requireUser` | — (read-only) |
| Submit review | `submitReview` | `requireUser` | `reviewInputSchema` + delivered-purchase check |
| Read product reviews | `getApprovedProductReviews` | Public | `APPROVED`-only filter |
| Send contact message | `sendContactMessage` | Public | `contactInputSchema`; Resend delivery (honest degradation) |

**Zero orphaned interactions:** there is no storefront mutation that reaches Prisma without passing through a guarded, validated action. (The unused `clearUserCart` action was deleted in Batch 3 — G8.)

### 5.1 Authentication interactions (Better Auth endpoints)

The account-lifecycle screens (§1.4) call Better Auth's own hardened endpoints rather than bespoke server actions. Identity, tokens, and rate-limiting are enforced by Better Auth; the app configures the mailers server-side in [src/lib/auth.ts](../src/lib/auth.ts).

| User interaction | Client call | Server behaviour |
|---|---|---|
| Sign up | `authClient.signUp.email` | Creates the user; sends verification when a mailer is configured (else account is immediately usable) |
| Sign in | `authClient.signIn.email` / `.social` | Rejects unverified emails (when mailer on) with `EMAIL_NOT_VERIFIED`; returns to sanitized `callbackUrl` |
| Resend verification | `authClient.sendVerificationEmail` | Re-issues the verification link |
| Request password reset | `authClient.requestPasswordReset` | `emailAndPassword.sendResetPassword` mails a tokenized `/reset-password` link (no-op + warn if no mailer) |
| Complete password reset | `authClient.resetPassword` | Consumes the token, sets the new password |
