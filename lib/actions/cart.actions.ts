"use server";
import { CartItems } from "../../src/context/ShopContext";
import { prisma } from "../prisma";
import { requireUser } from "@/lib/auth-guards";

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
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id, productId: Number(productId), size },
      });
    } else {
      await prisma.cartItem.upsert({
        where: {
          userId_productId_size: {
            userId: user.id,
            productId: Number(productId),
            size,
          },
        },
        update: { quantity },
        create: { userId: user.id, productId: Number(productId), size, quantity },
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
    for (const productId in localCart) {
      for (const size in localCart[productId]) {
        const quantity = localCart[productId][size];

        await prisma.cartItem.upsert({
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
    return { success: true };
  } catch (error) {
    console.error("mergeCartAction error:", error);
    return { success: false };
  }
}
