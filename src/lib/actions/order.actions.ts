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
 * Thrown inside the order transaction when a line can't be fulfilled from
 * stock. A distinct subclass (still a PublicError, so its Arabic message is
 * safe to surface) lets the caller flag the failure as stock-related, which
 * drives client-side cart reconciliation (G10).
 */
class InsufficientStockError extends PublicError {}

/** Arabic, per-field messages for checkout validation failures (G11), keyed by
 *  the order-input field name that Zod reports. */
const ORDER_FIELD_MESSAGES: Record<string, string> = {
  customerName: "برجاء إدخال الاسم كاملاً.",
  customerEmail: "برجاء إدخال بريد إلكتروني صحيح.",
  customerPhone: "برجاء إدخال رقم هاتف صحيح.",
  governorate: "برجاء اختيار المحافظة.",
  address: "برجاء إدخال عنوان التوصيل.",
  paymentMethod: "طريقة الدفع غير صالحة.",
};

export interface CreateOrderResult {
  success: boolean;
  orderId?: number;
  message?: string;
  /** Present when the failure was caused by insufficient stock, so the client
   *  can reconcile the cart to what is actually available (G10). */
  reason?: "insufficient_stock";
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
        message: "بيانات الطلب غير صالحة. برجاء مراجعة الحقول المطلوبة.",
        fieldErrors,
      };
    }
    const orderInput = parsedOrder.data;

    // Normalize the payload: merge duplicate (id, size) lines into one so the
    // same variant isn't stock-checked/created twice and quantities are summed.
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
        message: "الدفع بالبطاقة غير متاح حالياً. برجاء اختيار الدفع عند الاستلام.",
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
          throw new InsufficientStockError(
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
          throw new InsufficientStockError(
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
          // Link the exact variant so cancel-restock can target it by id even
          // if the volume label is later renamed.
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
    // Flag stock failures so the client can auto-reconcile the cart (G10).
    if (error instanceof InsufficientStockError) {
      return {
        success: false,
        message: error.message,
        reason: "insufficient_stock",
      };
    }
    return {
      success: false,
      message: toPublicMessage(
        error,
        "تعذّر إتمام طلبك. برجاء المحاولة مرة أخرى."
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
      message: toPublicMessage(error, "تعذّر تحميل طلباتك."),
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
      message: toPublicMessage(error, "تعذّر تحميل الطلبات."),
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
      return { success: false, message: "الطلب غير موجود." };
    }

    // Enforce the state machine: terminal states can't move, and only the
    // declared transitions are permitted.
    const allowedNext = ALLOWED_TRANSITIONS[existingOrder.status] ?? [];
    if (!allowedNext.includes(newStatus)) {
      return {
        success: false,
        message: `لا يمكن تغيير حالة الطلب من ${existingOrder.status} إلى ${newStatus}.`,
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
            // Prefer the precise variantId FK; fall back to (productId, volume)
            // for legacy rows written before variantId existed.
            const restock = await tx.productVariant.updateMany({
              where: item.variantId
                ? { id: item.variantId }
                : { productId: item.productId, volume: item.size },
              data: { stock: { increment: item.quantity } },
            });

            // A no-op restock means the variant was renamed/deleted — the units
            // are silently lost. Surface it instead of swallowing it.
            if (restock.count === 0) {
              console.error(
                `[order ${orderId}] restock no-op for product ${item.productId} ` +
                  `(variantId=${item.variantId ?? "none"}, size=${item.size}); ` +
                  `variant may have been renamed or removed.`
              );
            }
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
      message: toPublicMessage(error, "فشل تحديث حالة الطلب."),
    };
  }
}
