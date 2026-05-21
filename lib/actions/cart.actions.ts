"use server";
import { CartItems } from "../../src/context/ShopContext";
import { prisma } from "../prisma";

export async function getUserCart(userId: string) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId },
    });
    const cartData: any = {};
    items.forEach((item) => {
      if (!cartData[item.productId]) cartData[item.productId] = {};
      cartData[item.productId][item.size] = item.quantity;
    });
    return { success: true, cartData };
  } catch (error) {
    return { success: false, cartData: {} };
  }
}

export async function updateCartInDB(
  userId: string,
  productId: number,
  size: string,
  quantity: number
) {
  try {
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId, productId: Number(productId), size },
      });
    } else {
      await prisma.cartItem.upsert({
        where: {
          userId_productId_size: { userId, productId: Number(productId), size },
        },
        update: { quantity },
        create: { userId, productId: Number(productId), size, quantity },
      });
    }
    return { success: true };
  } catch (error) {
    console.error("DB Update Error:", error);
    return { success: false };
  }
}

export async function clearUserCart(userId: string) {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
    return { success: true };
  } catch (error) {
    console.error("Clear Cart Error:", error);
    return { success: false };
  }
}

export async function mergeCartAction(userId: string, localCart: CartItems) {
  try {
    for (const productId in localCart) {
      for (const size in localCart[productId]) {
        const quantity = localCart[productId][size];

        await prisma.cartItem.upsert({
          where: {
            userId_productId_size: {
              userId,
              productId: Number(productId),
              size,
            },
          },
          update: { quantity: { increment: quantity } },
          create: {
            userId,
            productId: Number(productId),
            size,
            quantity,
          },
        });
      }
    }
    return { success: true };
  } catch (error) {
    console.error("MERGE CART ERROR:", error);
    return { success: false };
  }
}
