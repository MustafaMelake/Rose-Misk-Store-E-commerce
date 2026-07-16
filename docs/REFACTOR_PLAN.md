# REFACTOR_PLAN.md — Rose Misk Post-Merge Audit & Refactoring Plan

> **Audit date:** 2026-07-16 · **Auditor:** Claude (Principal Full-Stack Architect mode)
> **Scope:** `rose-misk/` app (Next.js 16.2.2 canary, React 19.2.4, Prisma 7.x, Better Auth 1.5.6, PostgreSQL on Neon)
> **Mode:** Read-only audit. No application code was modified. One read-only `information_schema` query was run against the Neon DB to verify column types.

---

## 1. Current State Summary

### ✅ What is configured correctly (verified)

| Area | Evidence |
|---|---|
| **TypeScript compiles clean** | `npx tsc --noEmit` → **0 errors, exit 0** (but see: `strict: false` caveat below) |
| **Prisma schema valid** | `npx prisma validate` → "schema is valid" |
| **Money is Decimal in schema AND in the live DB** | `ProductVariant.price`, `OrderItem.price`, `Order.totalAmount`, `Order.shippingFee` are all `Decimal @db.Decimal(10,2)` in schema and confirmed `numeric(10,2)` in Neon via introspection |
| **Atomic stock decrement** | `createOrder` uses `updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement } } })` inside `$transaction` with rollback on `count === 0` — race-safe (`rose-misk/lib/actions/order.actions.ts:90`) |
| **Server-side price recomputation** | Client-supplied totals are ignored; totals rebuilt from DB `Prisma.Decimal` math + shipping fee (`order.actions.ts:71-113`) |
| **Order status state machine** | `ALLOWED_TRANSITIONS` enforced; terminal states locked; cancel-restock is idempotent via conditional `updateMany` (`order.actions.ts:276-300`) |
| **Auth guards centralized** | `requireUser()` / `requireAdmin()` / `PublicError` / `toPublicMessage()` in `rose-misk/src/lib/auth-guards.ts`; used by order, product, review, cart actions |
| **Better Auth hardening present** | `requireEmailVerification: true`, role `input: false` (no self-elevation), account linking limited to trusted providers, built-in rate limit enabled (`rose-misk/lib/auth.ts`) |
| **Admin layout guard** | `src/app/admin/layout.tsx` re-checks session + `role === "ADMIN"` server-side (defense in depth with `proxy.ts`) |
| **Upload endpoint gated** | UploadThing `middleware` calls `requireAdmin()` before authorizing uploads (`src/app/api/uploadthing/core.ts`) |
| **Review gating** | Reviews require a DELIVERED order containing the product; `@@unique([userId, productId])`; PENDING → admin moderation |
| **Generated Prisma client in sync** | `node_modules/.prisma/client/schema.prisma` is content-identical to `prisma/schema.prisma` (differs only in line endings) |
| **Action test suites exist** | `lib/actions/*.test.ts` for cart, category, order, product, review (vitest) — a real asset for the refactor |
| **`.env` ignored by git** | `.gitignore` covers `.env`, `stripe.exe`, `dist`, `*.tsbuildinfo`; inner repo working tree is clean |

### ❌ What is broken or drifted (verified)

1. **Migration history is fiction — `prisma migrate deploy` will fail hard.**
   `npx prisma migrate status` reports **all 3 migrations "have not yet been applied"** against the live Neon DB, yet every table already exists. The DB was evidently shaped with `prisma db push`. Worse, the recorded migration SQL contradicts the live DB:
   - Migrations create `price`/`totalAmount` as `DOUBLE PRECISION`; the live DB has `numeric(10,2)`.
   - No migration creates `Review`, `ReviewStatus`, or `Order.shippingFee` at all.
   Any fresh environment, CI database, or `migrate deploy` step built from this history will either fail (`CREATE TABLE` collisions) or produce a Float-priced, review-less schema.

2. **Runtime bug: reviews without a comment always fail.**
   `submitReview` passes `comment: comment?.trim() || null` (`review.actions.ts:49`) but `Review.comment` is **non-nullable** (`String @db.Text`). Prisma rejects `null` at runtime → every comment-less review returns the generic "Failed to submit review." error. Invisible to `tsc` because `strict: false` disables `strictNullChecks`.

3. **Prisma version skew:** CLI `prisma@7.8.0` vs runtime `@prisma/client@7.7.0`. Generate/migrate behavior can diverge from the runtime client.

4. **Secrets exposure:** `env.txt` and `env-client.txt` in the workspace root duplicate the app's full secret set (`DATABASE_URL`, `BETTER_AUTH_SECRET`, Google/Facebook OAuth secrets, UploadThing token). They live *outside* the app's `.gitignore` scope, and an enclosing git repository at a higher directory level has been observed tracking files in this area. **Treat every one of these credentials as potentially leaked.**

5. **`npm run lint` is broken:** the script calls `next lint`, which was removed in Next.js 16 (project runs 16.2.2 canary).

6. **`strict: false` + `skipLibCheck: true`** — the clean `tsc` result is weaker than it looks; issue #2 above is exactly the class of bug it hides.

---

## 2. Identified Issues & Risks

### 🔐 Auth gaps

| # | Severity | Issue | Location |
|---|---|---|---|
| A1 | **High** | `src/app/admin/page.tsx` and `src/app/admin/users/page.tsx` query Prisma **directly** with no page-level guard — they rely solely on the parent layout. Next.js explicitly documents that layouts are not a data-authorization boundary (pages render in parallel with layouts; future PPR makes this worse). Every admin page that fetches data must guard itself (or fetch via a guarded action/DAL). | `src/app/admin/page.tsx:1`, `src/app/admin/users/page.tsx:2` |
| A2 | Medium | `proxy.ts` matcher protects `/checkout` and `/profile` — **routes that don't exist** — while the real authenticated routes `/orders` (and arguably `/placeorder`) are not matched at all. Guests hitting `/orders` get a silent empty state instead of a redirect. | `src/proxy.ts:50` |
| A3 | Medium | `proxy.ts` performs an HTTP **self-fetch** of `/api/auth/get-session` on every `/admin` request: adds latency, assumes the JSON shape (`session.user.role`), and breaks behind origin-rewriting proxies. Better Auth's `getSessionCookie()` optimistic check + the existing server-side layout/action guards is the recommended pattern. | `src/proxy.ts:22-44` |
| A4 | Medium | `src/types/auth.d.ts` augments `declare module "better-auth" { interface User … }`, but Better Auth's `User` is an **inferred type alias**, not an interface — the augmentation may silently not merge, leaving `session.user.role` implicitly `any` under `strict: false`. Needs verification under strict mode; the supported patterns are `inferAdditionalFields` (client) and `$Infer` exports (server). | `src/types/auth.d.ts` |
| A5 | Low | No explicit `trustedOrigins` in Better Auth config; `nextCookies()` plugin absent (only needed if server actions ever set auth cookies). | `lib/auth.ts` |

### 🗄️ Prisma / data-layer risks

| # | Severity | Issue | Location |
|---|---|---|---|
| D1 | **Critical** | Migration history diverged from live DB (details in §1.1). Needs a **squash + baseline** (`migrate diff --from-empty`, then `migrate resolve --applied`) before anyone runs `migrate dev`/`deploy`. | `prisma/migrations/*` |
| D2 | **High** | `Review.comment` non-nullable vs code passing `null` (§1.2). Decide: make column `String?` (comment truly optional) or always store `""`. | `prisma/schema.prisma:45`, `review.actions.ts:49` |
| D3 | High | `OrderItem` and `CartItem` identify variants by `(productId, size-string)` instead of a `variantId` FK. Renaming a variant's `volume` orphans cart rows and makes **cancel-restock silently no-op** (`updateMany` count is ignored at `order.actions.ts:288`). | schema + `order.actions.ts:288` |
| D4 | Medium | Prisma CLI/client version skew (7.8.0 vs 7.7.0). | `package.json` |
| D5 | Medium | `generator client { provider = "prisma-client-js" }` is the legacy generator on Prisma 7; plan the move to the new `prisma-client` generator (output under `src/generated/`, already pre-ignored in `.gitignore`) before Prisma 8 drops the old one. | `prisma/schema.prisma:1` |
| D6 | Low | `Order` has no `updatedAt` and no index on `status` (admin dashboard filters by it). | schema |
| D7 | Low | Decimal→number serialization is ad hoc: `serializeProduct` returns `as T` (type lies), `getInventoryProducts` returns **raw Decimals** (safe only while its consumer stays a server component), `getUserOrders` hand-rolls `toNumber`. One typed DTO layer is needed. | `product.actions.ts:14-20,403-426` |

### ⚡ Server Action vulnerabilities

Every exported function in a `"use server"` file is a **publicly invokable POST endpoint** — validation cannot be left to the UI.

| # | Severity | Issue | Location |
|---|---|---|---|
| S1 | High | **Cart actions are unvalidated**: `updateCartInDB(productId, size, quantity)` and `mergeCartAction(localCart)` accept arbitrary payloads — `NaN` ids, non-integer or absurd quantities (no max), arbitrary `size` strings. Merge runs N unbatched upserts outside a transaction and `increment`s without cap. | `cart.actions.ts:24-98` |
| S2 | High | **Product mutations are unvalidated**: `createProduct`/`updateProduct` coerce with `Number(v.price)` — `NaN`, **negative prices**, and negative stock all pass to Prisma; `VariantInput`/`ProductUpdateInput` are plain interfaces, not Zod schemas (contradicting `validations.ts`'s own doc comment). Admin-only surface, but admin sessions can be phished — validate anyway. | `product.actions.ts:45-94,151-221`, `lib/validations.ts:35-51` |
| S3 | Medium | `createProduct` accepts a client-supplied `rating`, and `Number(data.rating) \|\| 5` turns `0` into `5`. Ratings should be exclusively server-computed from approved reviews. | `product.actions.ts:72` |
| S4 | Medium | `getCategories` returns **raw `error.message`** to the client (the one action file that skipped the `toPublicMessage` sweep). | `category.actions.ts:18` |
| S5 | Medium | `submitReview` has no Zod schema: non-integer ratings hit Prisma as runtime errors; `comment` has no max length (unbounded `text`). | `review.actions.ts:13-71` |
| S6 | Medium | `getTopSellingProducts` computes revenue over **all** order items, including `CANCELLED` (and not-yet-paid) orders — admin dashboard overstates revenue. | `product.actions.ts:344-358` |
| S7 | Low | `getAllProducts(page, limit)` — no clamp; a caller can request `limit = 10^6`. `searchProducts` has no query length cap. | `product.actions.ts:255,287` |
| S8 | Low | `governorate` is validated only as "non-empty string"; unknown values silently get the default 85 EGP fee instead of rejection against `ALL_GOVERNORATES`. | `validations.ts:21`, `shipping.ts:36` |
| S9 | Low | `createOrder` deletes the user's **entire** cart even if they checked out a subset of items. | `order.actions.ts:140` |

### 🧹 Structure & tooling debt (merge aftermath)

| # | Issue |
|---|---|
| T1 | **Split-brain lib:** root `rose-misk/lib/` (auth, prisma, actions, validations) vs `rose-misk/src/lib/` (guards, utils) with the `@/*` alias covering only `src/*` → imports mix `@/lib/auth-guards` with `../../lib/shipping`. Unify under `src/` (or add an explicit alias). |
| T2 | **Server importing from a client file:** `cart.actions.ts` imports `CartItems` from `src/context/ShopContext.tsx` (a `"use client"` module). Type-only today, but an inverted dependency — shared types belong in `src/types/`. |
| T3 | **Floating versions:** `next: "canary"` and `eslint-config-next: "canary"` — non-reproducible builds (today resolves to 16.2.2). Pin. |
| T4 | **Dead dependencies (verified unused via grep):** `@auth/prisma-adapter` (NextAuth leftover), `bcryptjs` + `@types/bcryptjs`, `shadcn` (CLI as runtime dep), `update` (junk package). |
| T5 | **Repo pollution:** `stripe.exe` (27 MB, Stripe was removed from the code), `dist/` (a leftover **Vite** build from the pre-Next era), `playwright-report/`, `test-results/`, `tsconfig.tsbuildinfo` — most are git-ignored but still on disk. |
| T6 | **ShopContext:** fetches 100 products client-side on every visitor mount (`getAllProducts(1,100)`), unguarded `JSON.parse(localStorage…)` (corrupt data kills cart init), context `value` object rebuilt every render (re-renders all consumers), `DeliveryData` still has US-template fields (`state/zipcode/country`) remapped to governorate. |
| T7 | **i18n inconsistency:** user-facing errors mix Arabic and English; dates hardcode `en-GB`; currency is string-concatenated `"EGP "` instead of `Intl.NumberFormat`. |
| T8 | **Nested-repo hazard:** an enclosing git repository above the workspace shows `rose-misk` as an added-then-deleted gitlink and tracks sibling files (including, potentially, the env `.txt` dumps). The inner repo is fine; the outer one needs cleanup. |
| T9 | `npm run lint` broken (`next lint` removed in Next 16); no `typecheck` script; no CI. |

---

## 3. Master Refactoring Checklist

> Order matters: Phase 1 unblocks safe schema work, Phase 2 closes security gaps, Phase 3 fixes business logic, Phase 4 pays down structural debt. Each phase ends with a **verification gate**.

### Phase 1 — Database & Schema Sync

- [ ] **Rotate all credentials** found in `env.txt` / `env-client.txt` (Neon `DATABASE_URL`, `BETTER_AUTH_SECRET`, Google + Facebook OAuth secrets, UploadThing token/secret), then **delete both files** (move canonical values into `rose-misk/.env` only / a password manager)
- [ ] Verify the enclosing (outer) git repo no longer tracks anything under `Rose Misk/` (no gitlink, no env files in history — if they were ever committed, rotate again and scrub)
- [x] **Align Prisma versions:** bump `@prisma/client` to match `prisma` (7.8.x) in `package.json`, reinstall, regenerate *(done 2026-07-16: prisma, @prisma/client, @prisma/adapter-pg all at 7.8.0)*
- [x] **Baseline the migration history** (DB is correct; history is wrong):
  - [x] Archive the 3 existing migration folders (moved to `prisma/migrations_archive/`; git history keeps them)
  - [x] Generate a single squashed baseline: `20260716165910_baseline` (note: Prisma 7 flag is `--to-schema`, not `--to-schema-datamodel`)
  - [x] Mark it applied on Neon: `npx prisma migrate resolve --applied 20260716165910_baseline`
  - [x] Confirm: `npx prisma migrate status` → "Database schema is up to date"
- [x] **Schema fixes (one new migration — `20260716170500_schema_fixes`, applied via `migrate diff` + `migrate deploy`; also restored 5 indexes that `db push` drift had left missing in the live DB):**
  - [x] `Review.comment String?` (align with "comment is optional" semantics — pairs with the Phase 3 code fix)
  - [x] Add `variantId Int?` FK to `OrderItem` and `CartItem` (keep `size` for display); backfilled via `(productId, volume)` join (3/3 cart rows matched; 0 order items existed). **Decision: kept nullable** — `OrderItem.variantId` stays nullable permanently (`onDelete: SetNull` preserves order history); `CartItem.variantId` tightened in Phase 3 once code writes it on every insert
  - [x] Add `Order.updatedAt DateTime @default(now()) @updatedAt` and `@@index([status])`
- [x] **Decide generator migration** — decision: **deferred** past this refactor (as recommended); move `prisma-client-js` → new `prisma-client` generator with `output = "../src/generated/prisma"` before Prisma 8
- [x] Add `"postinstall": "prisma generate"` script so fresh clones get a client without running build
- [x] **Gate (2026-07-16):** `npx prisma validate` ✓ · `npx prisma migrate status` clean ✓ · `npx tsc --noEmit` exit 0 ✓ · vitest 56/56 passed ✓

### Phase 2 — Auth & Context Hardening

- [x] Add `requireAdmin()` at the top of **every** admin server component that fetches data directly: `src/app/admin/page.tsx`, `src/app/admin/users/page.tsx` *(done 2026-07-16: both now `await requireAdmin()` before any fetch. Audited the rest of `src/app/admin/**/page.tsx` — the other data-fetching pages already route through `requireAdmin()`-guarded actions; `products/[id]/edit` uses the intentionally-public `getProductById` and stays behind the layout+proxy guard)*
- [x] Adopt the rule "auth lives next to the data": move those pages' raw Prisma queries into guarded functions in the actions/DAL layer so the guard is impossible to skip *(done: new `lib/actions/dashboard.actions.ts#getDashboardStats` and `lib/actions/user.actions.ts#getAdminUsers`, each guarded by `requireAdmin()` and serializing Decimal→number at the boundary)*
- [x] Wrap `getCurrentUser()` in React `cache()` so layout + page + actions share one `getSession` per request *(done: `src/lib/auth-guards.ts`; admin layout now calls the cached `getCurrentUser()` instead of `auth.api.getSession` directly)*
- [x] **Rewrite `proxy.ts`:**
  - [x] Fix matcher: drop nonexistent `/checkout`, `/profile`; add `/orders`; keep `/admin/:path*`, `/login`, `/signup` *(also added `/placeorder`)*
  - [x] Replace cookie-name string checks + self-fetch with `getSessionCookie(request)` from `better-auth/cookies` (optimistic redirect only)
  - [x] Remove the per-request `/api/auth/get-session` fetch — the admin layout + per-action `requireAdmin()` are the real boundary *(removed entirely; no role check left in the proxy)*
- [x] **Verify role typing end-to-end:** confirmed `session.user.role` is `"ADMIN" | "USER"`, not `any` *(done via a temporary strict `Equals<…>` type probe covering server `$Infer`, client `authClient.$Infer`, the `SessionUser` re-export, and `getCurrentUser()`'s return — all exactly the union). Root cause was `additionalFields.role.type: "string"` inferring a loose `string`; fixed by declaring `type: ["ADMIN", "USER"]` (literal-array → union). Replaced the non-merging `src/types/auth.d.ts` augmentation with `src/types/auth.ts` (`$Infer` re-exports) and added `inferAdditionalFields<typeof auth>()` to `lib/auth-client.ts`*
- [x] Set explicit `trustedOrigins` (production domain + localhost) in `lib/auth.ts` *(localhost + `BETTER_AUTH_URL`/`NEXT_PUBLIC_BETTER_AUTH_URL` + comma-separated `TRUSTED_ORIGINS`, de-duplicated)*
- [ ] Confirm the Better Auth cookie settings for production (secure prefix appears in proxy — validate behind the real domain/HTTPS) — *deferred to production validation; `getSessionCookie` handles the `__Secure-` prefix automatically*
- [x] Optional: add `nextCookies()` plugin now to future-proof server-action auth flows *(added as the last plugin in `lib/auth.ts`)*
- [x] **Gate (2026-07-16):** `npx tsc --noEmit` exit 0 ✓ · vitest 56/56 ✓ · role-typing probe ✓. Remaining manual checks (guest → `/admin` redirected; USER → `/admin` redirected; guest → `/orders` redirected; admin flows work) need a running dev server + real sessions

### Phase 3 — Server Actions & Business Logic

- [ ] **Fix the review bug:** `comment: comment?.trim() || null` is valid once `Review.comment` is nullable (Phase 1); add a regression test for a comment-less review
- [ ] **Zod-validate every mutating action** (extend `lib/validations.ts`, honoring its doc comment):
  - [ ] `reviewInputSchema`: `productId` positive int, `rating` **int** 1–5, `comment` trimmed, max ~2000 chars, optional
  - [ ] `cartUpdateSchema`: `productId` positive int, `size` 1–50 chars, `quantity` int 0–`MAX_CART_QTY` (e.g. 20)
  - [ ] `cartMergeSchema`: record-shape validation + per-item clamp; wrap `mergeCartAction` in a single `$transaction`, cap post-merge quantity
  - [ ] `variantInputSchema`: `volume` non-empty ≤ 30 chars, `price` coerced decimal string, `>= 0`, ≤ 99,999,999.99, 2dp; `stock` int ≥ 0; **dedupe volumes** in payload
  - [ ] `productCreateSchema` / `productUpdateSchema` from the variant schema; validate `images` are HTTPS URLs on the allowed UploadThing hosts (`utfs.io`, `*.ufs.sh`)
- [ ] Remove `rating` from `createProduct` input entirely (server-computed from approved reviews only) — kills the `|| 5` bug
- [ ] `getCategories`: return `toPublicMessage(error, …)` instead of raw `error.message`
- [ ] `getTopSellingProducts`: filter revenue/quantity to fulfilled statuses (`order: { status: { in: [PAID, SHIPPED, DELIVERED] } }` — decide exact set); add test
- [ ] Clamp `getAllProducts` (`limit` ≤ 48, `page` ≥ 1) and `searchProducts` (query ≤ 100 chars)
- [ ] Validate `governorate` with `z.enum(ALL_GOVERNORATES)` (single source of truth from `lib/shipping.ts`)
- [ ] Use `variantId` (Phase 1) in `createOrder` decrement + cancel-restock; **log/alert when a restock `updateMany` returns `count === 0`** instead of ignoring it
- [ ] Decide + implement: `createOrder` deletes only the **ordered** cart items (or keep clear-all as explicit product decision)
- [ ] Normalize duplicate `(id, size)` entries in the order payload (merge quantities) before processing
- [ ] Extend the existing vitest suites to cover every new validation branch (invalid quantity, negative price, cancelled-order revenue exclusion, restock no-op logging)
- [ ] **Gate:** `npm run test` all green · manual: place COD order, cancel it, verify restock; submit review with/without comment ✓

### Phase 4 — UI, Types, and Component Cleanup

- [ ] **Enable strict TypeScript** in stages: `"strictNullChecks": true` → fix fallout → `"strict": true`; add `"typecheck": "tsc --noEmit"` script and run it in CI
- [ ] Create honest DTO types in `src/types/` (`SerializedProduct`, `SerializedVariant { price: number }`, `SerializedOrder`…); make `serializeProduct` return them (no `as T`), delete the `as unknown as Product[]` cast in `ShopContext`
- [ ] Serialize `getInventoryProducts` Decimals at the boundary (defuse the client-component landmine)
- [ ] Move `CartItems` + shared types out of `ShopContext.tsx` into `src/types/`; server actions import types only from there
- [ ] **Unify the lib split:** move root `lib/` → `src/lib/` (actions under `src/lib/actions/`), update all imports to `@/lib/...`, delete root `lib/`
- [ ] **ShopContext cleanup:** stop fetching the whole catalog client-side (products come from RSC props / dedicated fetch per page); guard `JSON.parse` with try/catch; memoize the context `value`; rename `DeliveryData` fields to match the domain (governorate, not state/zipcode)
- [ ] `/orders` guest experience: redirect via fixed proxy matcher (Phase 2) + friendly signed-out state
- [ ] **i18n/formatting pass:** one language policy for user-facing messages (Arabic-first given the audience); dates via `Intl.DateTimeFormat("ar-EG")`; money via `Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" })` — one shared `formatCurrency` in `src/lib/format.ts`
- [ ] **Dependency hygiene:** remove `@auth/prisma-adapter`, `bcryptjs`, `@types/bcryptjs`, `shadcn`, `update`; pin `next` + `eslint-config-next` to exact 16.2.x; fix `lint` script (`eslint .` with the existing flat config)
- [ ] Delete `dist/` (Vite leftover), `stripe.exe`, stale `playwright-report/` + `test-results/`
- [ ] Add CI (GitHub Actions): install → `prisma generate` → `typecheck` → `lint` → `vitest` → `next build`; optional Playwright smoke (browse → add to cart → COD checkout) reusing `playwright.config.ts`
- [ ] **Gate:** `tsc --noEmit` strict ✓ · `eslint` ✓ · vitest ✓ · `next build` ✓ · Playwright smoke ✓

---

## 4. Agentic Skills / Tool Access Required for Execution

| Capability | Needed for | Status |
|---|---|---|
| **Terminal (PowerShell/Bash)** | `npm`, `npx prisma migrate/generate/validate`, `vitest`, `next build` | Available — needs your approval for state-changing commands (installs, migrations) |
| **File Read/Write/Edit** | All code changes, moving `lib/` → `src/lib/` | Available |
| **Git operations** | Feature branches per phase (`refactor/phase-1-db-sync`…), commits, PRs (`gh` CLI if you want PR flow) | Available — I'll ask before committing/pushing |
| **Database network access** | `prisma migrate status/resolve/deploy` against Neon; read-only introspection checks | Works from this machine (verified); migration writes need your explicit go-ahead |
| **Dev server / browser (Playwright)** | Phase gates: real checkout, cancel-restock, review flows, admin guards | `playwright` already in devDeps; I'd use the `verify`/`run` skills to drive it |
| **Secret rotation** | Neon console, Google/Facebook OAuth consoles, UploadThing dashboard, `BETTER_AUTH_SECRET` regen | **Human-only** — I'll prepare the checklist; you rotate |

**Decisions I need from you before Phase 3** (flagged inline above): comment-optional vs required reviews · exact "revenue" status set · clear-whole-cart vs ordered-items-only · Arabic-only vs bilingual messages · strict governorate list vs free text.

---

### Appendix — Evidence log (2026-07-16)

- `npx tsc --noEmit` → exit 0, no output (non-strict config)
- `npx prisma validate` → schema valid
- `npx prisma migrate status` → 3 migrations found, **none applied**; DB `neondb` @ Neon eu-west-2
- Live introspection (`information_schema.columns`): `Order.shippingFee/totalAmount`, `OrderItem.price`, `ProductVariant.price` = `numeric(10,2)` ✓ · `Product.rating` = `double precision` (matches `Float`) · `Review` table exists · `_prisma_migrations` table exists but does not record the 3 local migrations
- Migration SQL grep: `DOUBLE PRECISION` on all money columns; zero `DECIMAL` occurrences; no `CREATE TABLE "Review"`
- `diff --strip-trailing-cr` schema vs generated client copy → identical
- Dead-dep grep (`bcryptjs|@auth/prisma-adapter|shadcn|update`) across `src/`, `lib/`, `prisma/` → no usages
