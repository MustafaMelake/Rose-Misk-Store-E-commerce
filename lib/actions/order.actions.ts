"use server";
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

export type OrderStatusType =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "AWAITING_PAYMENT";

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
        const variant = await tx.productVariant.findFirst({
          where: { productId: item.id, volume: item.size },
        });

        if (!variant) {
          throw new PublicError(
            `المنتج ذو الحجم ${item.size} غير متوفر بالكمية المطلوبة.`
          );
        }

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

        orderItemsToCreate.push({
          productId: item.id,
          quantity: item.quantity,
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
      total: toNumber(order.totalAmount),
      shippingFee: toNumber(order.shippingFee),
      governorate: order.governorate,
      items: order.items.map((item) => ({
        id: item.productId,
        name: item.product.name,
        image: item.product.images[0] || "",
        size: item.size,
        quantity: item.quantity,
        price: toNumber(item.price),
      })),
    }));

    return { success: true, orders: formattedOrders };
  } catch (error) {
    console.error("getUserOrders error:", error);
    return {
      success: false,
      message: toPublicMessage(error, "Could not load your orders."),
    };
  }
}

export async function getAllOrders() {
  try {
    await requireAdmin();

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
  }
}

export async function updateOrderStatus(
  orderId: number,
  newStatus: OrderStatusType
) {
  try {
    await requireAdmin();

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!existingOrder) {
      return { success: false, message: "Order not found" };
    }

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
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: { status: newStatus },
        });
      }
    });

    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return {
      success: false,
      message: toPublicMessage(error, "Update failed"),
    };
  }
}
