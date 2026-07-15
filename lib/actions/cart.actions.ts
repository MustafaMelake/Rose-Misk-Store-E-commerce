"use server";
import { CartItems } from "../../src/context/ShopContext";
import { prisma } from "../prisma";
<<<<<<< HEAD

export async function getUserCart(userId: string) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId },
    });
    const cartData: any = {};
=======
import { requireUser } from "@/lib/auth-guards";

export async function getUserCart() {
  try {
    const user = await requireUser();
    const items = await prisma.cartItem.findMany({
      where: { userId: user.id },
    });
    const cartData: Record<string, Record<string, number>> = {};
>>>>>>> client-release
    items.forEach((item) => {
      if (!cartData[item.productId]) cartData[item.productId] = {};
      cartData[item.productId][item.size] = item.quantity;
    });
    return { success: true, cartData };
  } catch (error) {
<<<<<<< HEAD
=======
    console.error("getUserCart error:", error);
>>>>>>> client-release
    return { success: false, cartData: {} };
  }
}

export async function updateCartInDB(
<<<<<<< HEAD
  userId: string,
=======
>>>>>>> client-release
  productId: number,
  size: string,
  quantity: number
) {
  try {
<<<<<<< HEAD
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId, productId: Number(productId), size },
=======
    const user = await requireUser();
    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: { userId: user.id, productId: Number(productId), size },
>>>>>>> client-release
      });
    } else {
      await prisma.cartItem.upsert({
        where: {
<<<<<<< HEAD
          userId_productId_size: { userId, productId: Number(productId), size },
        },
        update: { quantity },
        create: { userId, productId: Number(productId), size, quantity },
=======
          userId_productId_size: {
            userId: user.id,
            productId: Number(productId),
            size,
          },
        },
        update: { quantity },
        create: { userId: user.id, productId: Number(productId), size, quantity },
>>>>>>> client-release
      });
    }
    return { success: true };
  } catch (error) {
<<<<<<< HEAD
    console.error("DB Update Error:", error);
=======
    console.error("updateCartInDB error:", error);
>>>>>>> client-release
    return { success: false };
  }
}

<<<<<<< HEAD
export async function clearUserCart(userId: string) {
  try {
    await prisma.cartItem.deleteMany({
      where: { userId },
    });
    return { success: true };
  } catch (error) {
    console.error("Clear Cart Error:", error);
=======
export async function clearUserCart() {
  try {
    const user = await requireUser();
    await prisma.cartItem.deleteMany({
      where: { userId: user.id },
    });
    return { success: true };
  } catch (error) {
    console.error("clearUserCart error:", error);
>>>>>>> client-release
    return { success: false };
  }
}

<<<<<<< HEAD
export async function mergeCartAction(userId: string, localCart: CartItems) {
  try {
=======
export async function mergeCartAction(localCart: CartItems) {
  try {
    const user = await requireUser();
>>>>>>> client-release
    for (const productId in localCart) {
      for (const size in localCart[productId]) {
        const quantity = localCart[productId][size];

        await prisma.cartItem.upsert({
          where: {
            userId_productId_size: {
<<<<<<< HEAD
              userId,
=======
              userId: user.id,
>>>>>>> client-release
              productId: Number(productId),
              size,
            },
          },
          update: { quantity: { increment: quantity } },
          create: {
<<<<<<< HEAD
            userId,
=======
            userId: user.id,
>>>>>>> client-release
            productId: Number(productId),
            size,
            quantity,
          },
        });
      }
    }
    return { success: true };
  } catch (error) {
<<<<<<< HEAD
    console.error("MERGE CART ERROR:", error);
=======
    console.error("mergeCartAction error:", error);
>>>>>>> client-release
    return { success: false };
  }
}
