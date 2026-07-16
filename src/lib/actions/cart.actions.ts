"use server";
import { CartItems } from "@/context/ShopContext";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-guards";
import { cartUpdateSchema, cartMergeSchema, MAX_CART_QTY } from "@/lib/validations";

export async function getUserCart() {
  try {
    const user = await requireUser();
    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
    });
    const cartData: Record<string, Record<string, number>> = {};
    items.forEach((item) => {
      if (!cartData[item.productId]) cartData[item.productId] = {};
      cartData[item.productId][item.size] = item.quantity;
    });
    return { success: true, cartData };
  } catch (error) {
    console.error("getUserCart error:", error);
    return { success: false, cartData: {} };
  }
}

export async function updateCartInDB(
  productId: number,
  size: string,
  quantity: number
) {
  try {
    const user = await requireUser();

    // Validate the untrusted payload: positive int id, 1–50 char size, and an
    // integer quantity in [0, MAX_CART_QTY] (0 means "remove this line").
    const parsed = cartUpdateSchema.safeParse({ productId, size, quantity });
    if (!parsed.success) {
      return { success: false };
    }
    const { productId: pid, size: vsize, quantity: qty } = parsed.data;

    if (qty <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id, productId: pid, size: vsize },
      });
    } else {
      await prisma.cartItem.upsert({
        where: {
          userId_productId_size: {
            userId: user.id,
            productId: pid,
            size: vsize,
          },
        },
        update: { quantity: qty },
        create: { userId: user.id, productId: pid, size: vsize, quantity: qty },
      });
    }
    return { success: true };
  } catch (error) {
    console.error("updateCartInDB error:", error);
    return { success: false };
  }
}

export async function clearUserCart() {
  try {
    const user = await requireUser();
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });
    return { success: true };
  } catch (error) {
    console.error("clearUserCart error:", error);
    return { success: false };
  }
}

export async function mergeCartAction(localCart: CartItems) {
  try {
    const user = await requireUser();

    // Validate the whole guest cart shape and clamp each line to [1, MAX].
    const parsed = cartMergeSchema.safeParse(localCart);
    if (!parsed.success) {
      return { success: false };
    }
    const merged = parsed.data;

    // Run every upsert in ONE transaction so a partial merge can't leave the
    // cart half-migrated, then cap any post-merge total at MAX_CART_QTY.
    await prisma.$transaction(async (tx) => {
      for (const productId in merged) {
        for (const size in merged[productId]) {
          const quantity = merged[productId][size];

          await tx.cartItem.upsert({
            where: {
              userId_productId_size: {
                userId: user.id,
                productId: Number(productId),
                size,
              },
            },
            update: { quantity: { increment: quantity } },
            create: {
              userId: user.id,
              productId: Number(productId),
              size,
              quantity,
            },
          });
        }
      }

      await tx.cartItem.updateMany({
        where: { userId: user.id, quantity: { gt: MAX_CART_QTY } },
        data: { quantity: MAX_CART_QTY },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("mergeCartAction error:", error);
    return { success: false };
  }
}
