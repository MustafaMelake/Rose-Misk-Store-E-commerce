"use server";
<<<<<<< HEAD
import { prisma } from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { calculateShippingFee } from "../../lib/shipping";
=======
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { calculateShippingFee } from "../../lib/shipping";
import { orderInputSchema, orderItemsInputSchema } from "../validations";
import {
  getCurrentUser,
  requireUser,
  requireAdmin,
  PublicError,
  toPublicMessage,
} from "@/lib/auth-guards";
>>>>>>> client-release

export type OrderStatusType =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "AWAITING_PAYMENT";

<<<<<<< HEAD
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
=======
/**
 * Allowed order status transitions. DELIVERED and CANCELLED are terminal —
 * no further changes are permitted once an order reaches them.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatusType[]> = {
  PENDING: ["AWAITING_PAYMENT", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "PENDING", "SHIPPED", "CANCELLED"],
  PAID: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Convert Prisma.Decimal (or number) into a plain number for the client. */
function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  return value == null ? 0 : Number(value);
}

export async function createOrder(orderData: unknown, items: unknown) {
  try {
    // Identity is derived from the session, never from the client.
    // A null user is a valid guest checkout.
    const currentUser = await getCurrentUser();
    const userId = currentUser?.id ?? null;

    // Validate untrusted client input at the boundary. The client-supplied
    // total is intentionally ignored — pricing is recomputed server-side.
    const parsedOrder = orderInputSchema.safeParse(orderData);
    const parsedItems = orderItemsInputSchema.safeParse(items);
    if (!parsedOrder.success || !parsedItems.success) {
      return {
        success: false,
        message: "Invalid order details. Please review your information.",
      };
    }
    const orderInput = parsedOrder.data;
    const orderItems = parsedItems.data;

    // Card payments are not wired to a gateway yet — reject them explicitly
    // instead of creating an order that can never be paid.
    if (orderInput.paymentMethod === "CARD") {
      return {
        success: false,
        message:
          "Card payments are not available yet. Please choose Cash on Delivery.",
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      let serverTotal = new Prisma.Decimal(0);
      const orderItemsToCreate: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] =
        [];

      for (const item of orderItems) {
>>>>>>> client-release
        const variant = await tx.productVariant.findFirst({
          where: { productId: item.id, volume: item.size },
        });

<<<<<<< HEAD
        if (!variant || variant.stock < item.quantity) {
          throw new Error(
=======
        if (!variant) {
          throw new PublicError(
>>>>>>> client-release
            `المنتج ذو الحجم ${item.size} غير متوفر بالكمية المطلوبة.`
          );
        }

<<<<<<< HEAD
        serverTotal += variant.price * item.quantity;
=======
        // Atomic, conditional decrement: the stock check and the write happen
        // in a single statement, so two shoppers cannot both buy the last unit.
        // If the guard fails, count === 0 and the whole transaction rolls back.
        const updated = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new PublicError(
            `المنتج ذو الحجم ${item.size} غير متوفر بالكمية المطلوبة.`
          );
        }

        const unitPrice = new Prisma.Decimal(variant.price);
        serverTotal = serverTotal.add(unitPrice.mul(item.quantity));
>>>>>>> client-release

        orderItemsToCreate.push({
          productId: item.id,
          quantity: item.quantity,
<<<<<<< HEAD
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
=======
          price: unitPrice,
          size: item.size,
        });
      }

      const deliveryFee = calculateShippingFee(orderInput.governorate);
      const finalTotal = serverTotal.add(deliveryFee);

      // Only COD reaches this point (CARD is rejected above).
      const initialStatus: OrderStatusType = "PENDING";

      const orderCreationData: Prisma.OrderUncheckedCreateInput = {
        customerName: orderInput.customerName,
        customerEmail: orderInput.customerEmail,
        customerPhone: orderInput.customerPhone,
        governorate: orderInput.governorate,
        address: orderInput.address,
        shippingFee: deliveryFee,
        totalAmount: finalTotal,
        paymentMethod: orderInput.paymentMethod,
>>>>>>> client-release
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
<<<<<<< HEAD
  } catch (error: any) {
    console.error("Order Action Error:", error.message);
    return { success: false, message: error.message };
  }
}

export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
=======
  } catch (error) {
    console.error("createOrder error:", error);
    return {
      success: false,
      message: toPublicMessage(
        error,
        "Failed to place your order. Please try again."
      ),
    };
  }
}

export async function getUserOrders() {
  try {
    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
>>>>>>> client-release
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
<<<<<<< HEAD
      total: order.totalAmount,
      shippingFee: order.shippingFee,
=======
      total: toNumber(order.totalAmount),
      shippingFee: toNumber(order.shippingFee),
>>>>>>> client-release
      governorate: order.governorate,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        image: item.product.images[0] || "",
        size: item.size,
        quantity: item.quantity,
<<<<<<< HEAD
        price: item.price,
=======
        price: toNumber(item.price),
>>>>>>> client-release
      })),
    }));

    return { success: true, orders: formattedOrders };
<<<<<<< HEAD
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return { success: false, message: error.message };
=======
  } catch (error) {
    console.error("getUserOrders error:", error);
    return {
      success: false,
      message: toPublicMessage(error, "Could not load your orders."),
    };
>>>>>>> client-release
  }
}

export async function getAllOrders() {
  try {
<<<<<<< HEAD
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized Access: Admins only." };
    }
=======
    await requireAdmin();
>>>>>>> client-release

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

<<<<<<< HEAD
    return { success: true, orders };
  } catch (error) {
    console.error("Admin Fetch Error:", error);
    return { success: false, message: "Failed to fetch orders" };
=======
    const serialized = orders.map((order) => ({
      ...order,
      totalAmount: toNumber(order.totalAmount),
      shippingFee: toNumber(order.shippingFee),
      items: (order.items ?? []).map((item) => ({
        ...item,
        price: toNumber(item.price),
      })),
    }));

    return { success: true, orders: serialized };
  } catch (error) {
    console.error("getAllOrders error:", error);
    return {
      success: false,
      message: toPublicMessage(error, "Failed to fetch orders"),
    };
>>>>>>> client-release
  }
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatusType
) {
  try {
<<<<<<< HEAD
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return { success: false, message: "Unauthorized" };
    }
=======
    await requireAdmin();
>>>>>>> client-release

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return { success: false, message: "Order not found" };
    }

<<<<<<< HEAD
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
=======
    // Enforce the state machine: terminal states can't move, and only the
    // declared transitions are permitted.
    const allowedNext = ALLOWED_TRANSITIONS[existingOrder.status] ?? [];
    if (!allowedNext.includes(newStatus)) {
      return {
        success: false,
        message: `Cannot change order status from ${existingOrder.status} to ${newStatus}.`,
      };
    }

    await prisma.$transaction(async (tx) => {
      if (newStatus === "CANCELLED") {
        // Flip to CANCELLED only if it isn't already — atomic so two
        // concurrent cancellations can't both restock the same order.
        const res = await tx.order.updateMany({
          where: { id: orderId, status: { not: "CANCELLED" } },
          data: { status: "CANCELLED" },
        });

        // Restock only when this call is the one that performed the cancel.
        if (res.count === 1) {
          for (const item of existingOrder.items) {
            await tx.productVariant.updateMany({
              where: { productId: item.productId, volume: item.size },
>>>>>>> client-release
              data: { stock: { increment: item.quantity } },
            });
          }
        }
<<<<<<< HEAD
=======
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: { status: newStatus },
        });
>>>>>>> client-release
      }
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
<<<<<<< HEAD
    console.error("Update Status Error:", error);
    return { success: false, message: "Update failed" };
=======
    console.error("updateOrderStatus error:", error);
    return {
      success: false,
      message: toPublicMessage(error, "Update failed"),
    };
>>>>>>> client-release
  }
}
