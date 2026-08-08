"use server";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateShippingFee } from "@/lib/shipping";
import { formatDate } from "@/lib/format";
import {
  orderInputSchema,
  orderItemsInputSchema,
  type OrderItemInput,
} from "@/lib/validations";
import {
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
 *
 * COD-only lifecycle: PENDING → SHIPPED → DELIVERED, with CANCELLED reachable
 * at any non-terminal point. AWAITING_PAYMENT and PAID are legacy
 * payment-gateway states that new orders can no longer enter (G2/G3); they are
 * kept as source keys purely so any historical order still sitting in one of
 * them can be moved forward or cancelled.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatusType[]> = {
  PENDING: ["SHIPPED", "DELIVERED", "CANCELLED"],
  AWAITING_PAYMENT: ["SHIPPED", "DELIVERED", "CANCELLED"],
  PAID: ["SHIPPED", "DELIVERED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Convert Prisma.Decimal (or number) into a plain number for the client. */
function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  return value == null ? 0 : Number(value);
}

/**
 * Thrown inside the order transaction when a line points at a variant that is
 * missing or switched off. A distinct subclass (still a PublicError, so its
 * message is safe to surface) lets the caller flag the failure as
 * availability-related, which drives client-side cart reconciliation (G10).
 */
class VariantUnavailableError extends PublicError {}

/** Arabic, per-field messages for checkout validation failures (G11), keyed by
 *  the order-input field name that Zod reports. */
const ORDER_FIELD_MESSAGES: Record<string, string> = {
  customerName: "Please enter your full name.",
  customerEmail: "Please enter a valid email address.",
  customerPhone: "Please enter a valid phone number.",
  governorate: "Please select a governorate.",
  address: "Please enter a delivery address.",
  paymentMethod: "Invalid payment method.",
};

export interface CreateOrderResult {
  success: boolean;
  orderId?: number;
  message?: string;
  /** Present when the failure was caused by an unavailable variant, so the
   *  client can reconcile the cart against what is still sellable (G10). */
  reason?: "unavailable";
  /** Per-field Arabic messages keyed by order-input field name (G11). */
  fieldErrors?: Record<string, string>;
}

export async function createOrder(
  orderData: unknown,
  items: unknown
): Promise<CreateOrderResult> {
  try {
    // Identity is derived from the session, never from the client.
    // Checkout requires an authenticated user — this matches the /placeorder
    // route guard in proxy.ts, so guests are rejected here too (defense in
    // depth: server actions are public POST endpoints regardless of the UI).
    const user = await requireUser();
    const userId = user.id;

    // Validate untrusted client input at the boundary. The client-supplied
    // total is intentionally ignored — pricing is recomputed server-side.
    const parsedOrder = orderInputSchema.safeParse(orderData);
    const parsedItems = orderItemsInputSchema.safeParse(items);
    if (!parsedOrder.success || !parsedItems.success) {
      // Map Zod's field errors to Arabic, per-field messages the checkout form
      // can render under the offending inputs (G11).
      const fieldErrors: Record<string, string> = {};
      if (!parsedOrder.success) {
        const flat = parsedOrder.error.flatten().fieldErrors;
        for (const key of Object.keys(flat)) {
          if (ORDER_FIELD_MESSAGES[key]) fieldErrors[key] = ORDER_FIELD_MESSAGES[key];
        }
      }
      return {
        success: false,
        message: "Invalid order details. Please review the highlighted fields.",
        fieldErrors,
      };
    }
    const orderInput = parsedOrder.data;

    // Normalize the payload: merge duplicate (id, size) lines into one so the
    // same variant isn't checked/created twice and quantities are summed.
    const mergedItemsMap = new Map<string, OrderItemInput>();
    for (const item of parsedItems.data) {
      const key = `${item.id}__${item.size}`;
      const existing = mergedItemsMap.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        mergedItemsMap.set(key, { ...item });
      }
    }
    const orderItems = Array.from(mergedItemsMap.values());

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

        // Availability is a plain toggle now: the variant must exist and be
        // switched on. Nothing is decremented — quantities are not tracked.
        if (!variant || variant.isAvailable !== true) {
          throw new VariantUnavailableError(
            `Product size ${item.size} is currently unavailable.`
          );
        }

        const unitPrice = new Prisma.Decimal(variant.price);
        serverTotal = serverTotal.add(unitPrice.mul(item.quantity));

        orderItemsToCreate.push({
          productId: item.id,
          quantity: item.quantity,
          price: unitPrice,
          size: item.size,
          // Link the exact variant so order history still resolves to the row
          // that was bought even if the volume label is later renamed.
          variantId: variant.id,
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
        userId,
        items: { create: orderItemsToCreate },
      };

      const newOrder = await tx.order.create({
        data: orderCreationData,
      });

      // Remove ONLY the lines that were just ordered — a partial checkout
      // must not wipe items the customer left in their cart.
      await tx.cartItem.deleteMany({
        where: {
          userId,
          OR: orderItems.map((it) => ({ productId: it.id, size: it.size })),
        },
      });

      return newOrder;
    });

    revalidatePath("/orders");

    return { success: true, orderId: result.id };
  } catch (error) {
    console.error("createOrder error:", error);
    // Flag availability failures so the client can auto-reconcile the cart (G10).
    if (error instanceof VariantUnavailableError) {
      return {
        success: false,
        message: error.message,
        reason: "unavailable",
      };
    }
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
      date: formatDate(order.createdAt),
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
      message: toPublicMessage(error, "Failed to fetch orders."),
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
      select: { status: true },
    });

    if (!existingOrder) {
      return { success: false, message: "Order not found." };
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

    // Cancelling no longer restocks anything — quantities aren't tracked — so
    // each branch is a single statement and needs no surrounding transaction.
    if (newStatus === "CANCELLED") {
      // Flip to CANCELLED only if it isn't already, so two concurrent
      // cancellations can't both claim to have performed it.
      await prisma.order.updateMany({
        where: { id: orderId, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      });
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
    }

    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return {
      success: false,
      message: toPublicMessage(error, "Update failed."),
    };
  }
}
