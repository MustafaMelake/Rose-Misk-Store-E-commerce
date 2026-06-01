"use server";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { calculateShippingFee } from "../../lib/shipping";

export type OrderStatusType =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "AWAITING_PAYMENT";

export async function createOrder(
  userId: string | null,
  orderData: any,
  items: { id: number; size: string; quantity: number }[]
) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      let serverTotal = 0;
      const orderItemsToCreate = [];

      for (const item of items) {
        const variant = await tx.productVariant.findFirst({
          where: { productId: item.id, volume: item.size },
        });

        if (!variant || variant.stock < item.quantity) {
          throw new Error(
            `المنتج ذو الحجم ${item.size} غير متوفر بالكمية المطلوبة.`
          );
        }

        serverTotal += variant.price * item.quantity;

        orderItemsToCreate.push({
          productId: item.id,
          quantity: item.quantity,
          price: variant.price,
          size: item.size,
        });

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const deliveryFee = calculateShippingFee(orderData.governorate);
      const finalTotal = serverTotal + deliveryFee;

      const initialStatus = (
        orderData.paymentMethod === "CARD" ? "AWAITING_PAYMENT" : "PENDING"
      ) as OrderStatusType;

      const orderCreationData: any = {
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        governorate: orderData.governorate,
        address: orderData.address,
        shippingFee: deliveryFee,
        totalAmount: finalTotal,
        paymentMethod: orderData.paymentMethod || "COD",
        status: initialStatus,
        items: { create: orderItemsToCreate },
      };

      if (userId) {
        orderCreationData.userId = userId;
      }

      const newOrder = await tx.order.create({
        data: orderCreationData,
      });

      if (userId) {
        await tx.cartItem.deleteMany({ where: { userId } });
      }

      return newOrder;
    });

    revalidatePath("/orders");

    return { success: true, orderId: result.id };
  } catch (error: any) {
    console.error("Order Action Error:", error.message);
    return { success: false, message: error.message };
  }
}

export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              },
            },
          },
        },
      },
    });
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      date: order.createdAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: order.status,
      payment: order.paymentMethod,
      total: order.totalAmount,
      shippingFee: order.shippingFee,
      governorate: order.governorate,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        image: item.product.images[0] || "",
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    return { success: true, orders: formattedOrders };
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return { success: false, message: error.message };
  }
}

export async function getAllOrders() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized Access: Admins only." };
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: {
              select: { name: true, images: true },
            },
          },
        },
      },
    });

    return { success: true, orders };
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return { success: false, message: "Failed to fetch orders" };
  }
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatusType
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return { success: false, message: "Order not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      if (newStatus === "CANCELLED" && existingOrder.status !== "CANCELLED") {
        for (const item of existingOrder.items) {
          const variant = await tx.productVariant.findFirst({
            where: { productId: item.productId, volume: item.size },
          });

          if (variant) {
            await tx.productVariant.update({
              where: { id: variant.id },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      }
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false, message: "Update failed" };
  }
}
