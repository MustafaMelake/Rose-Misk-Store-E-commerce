import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} from "./order.actions";
import { prisma } from "../prisma";
import { requireAdmin, AuthError } from "@/lib/auth-guards";
import { revalidatePath } from "next/cache";

// 1. Mock Prisma and $transaction
vi.mock("../prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      return await callback(prisma);
    }),
    productVariant: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
  },
}));

// 2. Mock the auth guards — identity/authorization is derived server-side.
vi.mock("@/lib/auth-guards", () => {
  class PublicError extends Error {}
  class AuthError extends PublicError {}
  return {
    PublicError,
    AuthError,
    getCurrentUser: vi.fn(async () => ({ id: "user_123", role: "USER" })),
    requireUser: vi.fn(async () => ({ id: "user_123", role: "USER" })),
    requireAdmin: vi.fn(async () => ({ id: "admin_1", role: "ADMIN" })),
    toPublicMessage: (e: any, fb = "An unexpected error occurred.") =>
      e instanceof PublicError ? e.message : fb,
  };
});

// 3. Mock Next.js Cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// 4. Mock shipping to isolate the fee calculation
vi.mock("../../lib/shipping", () => ({
  calculateShippingFee: vi.fn((gov) => {
    if (gov === "القاهرة") return 75;
    if (gov === "سوهاج") return 115;
    return 85;
  }),
}));

describe("Order Server Actions", () => {
  const mockUserId = "user_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createOrder", () => {
    const mockOrderData = {
      customerName: "John Doe",
      customerEmail: "john@example.com",
      customerPhone: "123456789",
      governorate: "القاهرة",
      address: "123 Main St",
      paymentMethod: "COD",
    };

    const mockItems = [{ id: 1, size: "50ml", quantity: 2 }];

    it("should successfully create an order and clear the cart", async () => {
      // Arrange: variant priced at 100 with enough stock
      (prisma.productVariant.findFirst as any).mockResolvedValue({
        id: 99,
        productId: 1,
        volume: "50ml",
        price: 100,
        stock: 5,
      });
      // Atomic decrement succeeds (one row affected)
      (prisma.productVariant.updateMany as any).mockResolvedValue({ count: 1 });

      (prisma.order.create as any).mockResolvedValue({ id: 1001 });

      // Act — userId is derived from the session, not passed by the client
      const result = await createOrder(mockOrderData, mockItems);

      // Assert
      expect(prisma.productVariant.findFirst).toHaveBeenCalledWith({
        where: { productId: 1, volume: "50ml" },
      });

      // Atomic, conditional decrement (stock guard lives in the where clause)
      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
        where: { id: 99, stock: { gte: 2 } },
        data: { stock: { decrement: 2 } },
      });

      const callArgs = (prisma.order.create as any).mock.calls[0][0];
      expect(callArgs.data).toEqual(
        expect.objectContaining({
          customerName: "John Doe",
          governorate: "القاهرة",
          status: "PENDING",
          userId: mockUserId,
        })
      );
      // Money is stored as Decimal; compare numeric value
      // (2 * 100) + shipping (75) = 275
      expect(Number(callArgs.data.shippingFee)).toBe(75);
      expect(Number(callArgs.data.totalAmount)).toBe(275);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/orders");
      expect(result).toEqual({ success: true, orderId: 1001 });
    });

    it("should fail if the atomic stock decrement affects no rows", async () => {
      // Arrange
      (prisma.productVariant.findFirst as any).mockResolvedValue({
        id: 99,
        price: 100,
        stock: 1,
      });
      // Conditional decrement matched nothing -> insufficient stock
      (prisma.productVariant.updateMany as any).mockResolvedValue({ count: 0 });

      // Act
      const result = await createOrder(mockOrderData, mockItems);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("غير متوفر بالكمية المطلوبة");
      expect(prisma.order.create).not.toHaveBeenCalled();
    });

    it("should reject CARD payments while no gateway is configured", async () => {
      // Act
      const result = await createOrder(
        { ...mockOrderData, paymentMethod: "CARD" },
        mockItems
      );

      // Assert — rejected before any DB work
      expect(result.success).toBe(false);
      expect(result.message).toContain("Card payments are not available");
      expect(prisma.productVariant.updateMany).not.toHaveBeenCalled();
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });

  describe("getUserOrders", () => {
    it("should fetch and format user orders correctly", async () => {
      // Arrange
      const mockDate = new Date("2026-05-24T12:00:00Z");
      (prisma.order.findMany as any).mockResolvedValue([
        {
          id: 1,
          createdAt: mockDate,
          status: "DELIVERED",
          paymentMethod: "CARD",
          totalAmount: 575,
          shippingFee: 75,
          governorate: "القاهرة",
          items: [
            {
              productId: 10,
              size: "100ml",
              quantity: 1,
              price: 500,
              product: { name: "Perfume A", images: ["img.jpg"] },
            },
          ],
        },
      ]);

      // Act
      const result = await getUserOrders();

      // Assert
      expect(result.success).toBe(true);
      expect(result.orders![0].id).toBe(1);
      expect(result.orders![0].status).toBe("DELIVERED");
      expect(result.orders![0].shippingFee).toBe(75);
      expect(result.orders![0].governorate).toBe("القاهرة");
      expect(result.orders![0].items[0].name).toBe("Perfume A");
      expect(result.orders![0].items[0].price).toBe(500);
    });
  });

  describe("getAllOrders (Admin)", () => {
    it("should return orders if user is ADMIN", async () => {
      // Arrange
      (prisma.order.findMany as any).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      // Act
      const result = await getAllOrders();

      // Assert
      expect(result.success).toBe(true);
      expect(result.orders).toHaveLength(2);
    });

    it("should return unauthorized if user is not ADMIN or not logged in", async () => {
      // Arrange: the admin guard rejects
      vi.mocked(requireAdmin).mockRejectedValueOnce(
        new AuthError("Unauthorized: admin privileges are required.")
      );

      // Act
      const result = await getAllOrders();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unauthorized");
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });
  });

  describe("updateOrderStatus", () => {
    it("should atomically cancel and restock when transitioning to CANCELLED", async () => {
      // Arrange
      const existingOrder = {
        id: 5,
        status: "PENDING",
        items: [{ productId: 1, size: "50ml", quantity: 2 }],
      };

      (prisma.order.findUnique as any).mockResolvedValue(existingOrder);
      // The atomic flip to CANCELLED performed exactly one row
      (prisma.order.updateMany as any).mockResolvedValue({ count: 1 });
      (prisma.productVariant.updateMany as any).mockResolvedValue({ count: 1 });

      // Act
      const result = await updateOrderStatus(5, "CANCELLED");

      // Assert: atomic conditional status flip
      expect(prisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 5, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      });

      // Restock via atomic increment (keyed by productId + volume)
      expect(prisma.productVariant.updateMany).toHaveBeenCalledWith({
        where: { productId: 1, volume: "50ml" },
        data: { stock: { increment: 2 } },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
      expect(result.success).toBe(true);
    });

    it("should just update status without touching stock if status is NOT CANCELLED", async () => {
      // Arrange
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 5,
        status: "PENDING",
        items: [{ productId: 1, size: "50ml", quantity: 2 }],
      });

      // Act
      const result = await updateOrderStatus(5, "SHIPPED");

      // Assert
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: "SHIPPED" },
      });

      expect(prisma.productVariant.updateMany).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should reject an invalid transition out of a terminal state", async () => {
      // Arrange: order already delivered (terminal)
      (prisma.order.findUnique as any).mockResolvedValue({
        id: 5,
        status: "DELIVERED",
        items: [],
      });

      // Act
      const result = await updateOrderStatus(5, "SHIPPED");

      // Assert: no writes, clear rejection
      expect(result.success).toBe(false);
      expect(result.message).toContain("Cannot change order status");
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });
});
