import { z } from "zod";

/**
 * Centralized Zod schemas for validating server-action payloads at the trust
 * boundary. Actions parse untrusted client input with these before touching
 * the database, and derive their TypeScript types from the same source.
 */

export const orderItemInputSchema = z.object({
  id: z.number().int().positive(),
  size: z.string().trim().min(1),
  quantity: z.number().int().positive(),
});

export const orderItemsInputSchema = z.array(orderItemInputSchema).min(1);

export const orderInputSchema = z.object({
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email(),
  customerPhone: z.string().trim().min(6).max(30),
  governorate: z.string().trim().min(1),
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

/** Shape of a single product variant coming from the admin product forms. */
export interface VariantInput {
  volume: string;
  price: number | string;
  stock: number | string;
}

/** Payload accepted by `updateProduct`. */
export interface ProductUpdateInput {
  name: string;
  description?: string;
  company?: string;
  images: string[];
  isFeatured?: boolean;
  subcategory?: string | null;
  categoryId?: number | string | null;
  variants: VariantInput[];
}
