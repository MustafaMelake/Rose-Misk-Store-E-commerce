/**
 * Cart limits shared by the server-side Zod schemas and the client-side cart UI.
 *
 * Kept in its own module (rather than in `validations.ts`) so client components
 * can import the constant without pulling Zod and every server schema into the
 * browser bundle.
 */

/**
 * Hard cap on how many of a single variant a cart line may hold. Purely an
 * abuse guard — stock is a boolean availability toggle, not a quantity.
 */
export const MAX_CART_QTY = 20;
