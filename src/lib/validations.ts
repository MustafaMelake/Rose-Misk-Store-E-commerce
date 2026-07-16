import { z } from "zod";
import { ALL_GOVERNORATES } from "@/lib/shipping";

/**
 * Centralized Zod schemas for validating server-action payloads at the trust
 * boundary. Every exported function in a `"use server"` file is a public POST
 * endpoint, so actions parse untrusted client input with these before touching
 * the database, and derive their TypeScript types from the same source.
 */

/** Hard cap on how many of a single variant a cart line may hold. */
export const MAX_CART_QTY = 20;

/** Money never exceeds this (matches the DB `Decimal(10,2)` column). */
const MAX_PRICE = 99_999_999.99;

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export const orderItemInputSchema = z.object({
  id: z.number().int().positive(),
  size: z.string().trim().min(1).max(50),
  quantity: z.number().int().positive().max(MAX_CART_QTY),
});

export const orderItemsInputSchema = z.array(orderItemInputSchema).min(1);

export const orderInputSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().min(6).max(30),
  // Single source of truth: the governorate must be one we actually ship to
  // (same list that drives the shipping fee). Trimmed before the membership
  // check so trailing whitespace from a form field is tolerated.
  governorate: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.enum(ALL_GOVERNORATES as [string, ...string[]])
  ),
  address: z.string().trim().min(3).max(500),
  // Normalize casing and default to COD; anything else is rejected.
  paymentMethod: z
    .string()
    .optional()
    .transform((v) => (v ? v.toUpperCase() : "COD"))
    .pipe(z.enum(["COD", "CARD"])),
});

export type OrderInput = z.infer<typeof orderInputSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

// ---------------------------------------------------------------------------
// Cart
// ---------------------------------------------------------------------------

/** A single `updateCartInDB` call. `quantity: 0` means "remove this line". */
export const cartUpdateSchema = z.object({
  productId: z.number().int().positive(),
  size: z.string().trim().min(1).max(50),
  quantity: z.number().int().min(0).max(MAX_CART_QTY),
});

/**
 * A whole guest cart handed to `mergeCartAction`, shaped as
 * `{ [productId]: { [size]: quantity } }`. Quantities are clamped into
 * `[1, MAX_CART_QTY]`; ids/sizes outside the allowed shape are rejected.
 */
export const cartMergeSchema = z.record(
  z.string().regex(/^\d+$/, "Invalid product id"),
  z.record(
    z.string().trim().min(1).max(50),
    z.number().int().min(1).max(MAX_CART_QTY)
  )
);

export type CartUpdateInput = z.infer<typeof cartUpdateSchema>;

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewInputSchema = z.object({
  productId: z.number().int().positive(),
  // Keep the legacy user-facing message so out-of-range ratings read the same.
  rating: z
    .number()
    .int({ message: "Rating must be between 1 and 5." })
    .min(1, { message: "Rating must be between 1 and 5." })
    .max(5, { message: "Rating must be between 1 and 5." }),
  comment: z.string().trim().max(2000).optional(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;

// ---------------------------------------------------------------------------
// Products (admin)
// ---------------------------------------------------------------------------

/** True only for HTTPS URLs served from the allowed UploadThing hosts. */
function isUploadThingUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    return u.hostname === "utfs.io" || u.hostname.endsWith(".ufs.sh");
  } catch {
    return false;
  }
}

export const productImageSchema = z
  .string()
  .refine(isUploadThingUrl, {
    message: "Product images must be HTTPS URLs hosted on UploadThing.",
  });

/** Array of product image URLs (may be empty; each must be an UploadThing URL). */
export const productImagesSchema = z.array(productImageSchema).max(8);

export const variantInputSchema = z.object({
  volume: z.string().trim().min(1).max(30),
  price: z.coerce
    .number()
    .min(0, { message: "Price cannot be negative." })
    .max(MAX_PRICE)
    .refine((v) => Math.round(v * 100) === v * 100, {
      message: "Price supports at most 2 decimal places.",
    }),
  stock: z.coerce
    .number()
    .int({ message: "Stock must be a whole number." })
    .min(0, { message: "Stock cannot be negative." }),
});

/** One or more variants, with duplicate volumes rejected. */
export const variantsInputSchema = z
  .array(variantInputSchema)
  .min(1, { message: "At least one variant is required." })
  .superRefine((variants, ctx) => {
    const seen = new Set<string>();
    for (const v of variants) {
      const key = v.volume.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate variant volume: ${v.volume}`,
        });
      }
      seen.add(key);
    }
  });

/** categoryId as it arrives from the form: number, "", null, or absent. */
const categoryIdSchema = z
  .preprocess(
    (v) => (v === "" ? null : v),
    z.union([z.coerce.number().int().positive(), z.null()])
  )
  .optional();

export const productCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(5000),
  company: z.string().trim().min(1).max(120),
  images: productImagesSchema,
  isFeatured: z.boolean().optional().default(false),
  categoryId: categoryIdSchema,
  subcategory: z.string().trim().max(60).optional(),
  variants: variantsInputSchema,
  // NOTE: `rating` is intentionally absent — it is server-computed from
  // approved reviews and must never come from client input.
});

export const productUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  company: z.string().trim().max(120).optional(),
  images: productImagesSchema,
  isFeatured: z.boolean().optional(),
  categoryId: categoryIdSchema,
  subcategory: z.string().trim().max(60).nullable().optional(),
  variants: variantsInputSchema,
});

export type VariantInput = z.infer<typeof variantInputSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
