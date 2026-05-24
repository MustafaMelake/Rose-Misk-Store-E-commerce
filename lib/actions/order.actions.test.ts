import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} from "./order.actions";
import { prisma } from "../prisma";
import { auth } from "../auth";
import { revalidatePath } from "next/cache";

// 1. Mock Prisma and $transaction
// We mock $transaction to simply execute the callback function we pass to it.
vi.mock("../prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      return await callback(prisma);
    }),
    productVariant: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      deleteMany: vi.fn(),
    },
  },
}));

// 2. Mock Auth (Better-Auth / NextAuth)
vi.mock("../auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// 3. Mock Next.js Headers and Cache
vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
      address: "123 Main St",
      paymentMethod: "COD",
    };

    const mockItems = [{ id: 1, size: "50ml", quantity: 2 }];

    it("should successfully create an order and clear the cart", async () => {
      // Arrange: Mock the product variant existing with enough stock
      (prisma.productVariant.findFirst as any).mockResolvedValue({
        id: 99,
        productId: 1,
        volume: "50ml",
        price: 100,
        stock: 5,
      });

      // Mock order creation returning an ID
      (prisma.order.create as any).mockResolvedValue({ id: 1001 });

      // Act
      const result = await createOrder(mockUserId, mockOrderData, mockItems);

      // Assert
      expect(prisma.productVariant.findFirst).toHaveBeenCalledWith({
        where: { productId: 1, volume: "50ml" },
      });

      // Check if stock was decremented
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { stock: { decrement: 2 } },
      });

      // Check if order was created with correct total (2 * 100 + 80 delivery)
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerName: "John Doe",
          totalAmount: 280,
          status: "PENDING",
          userId: mockUserId,
        }),
      });

      // Check if cart was cleared
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/orders");
      expect(result).toEqual({ success: true, orderId: 1001 });
    });

    it("should fail if product variant does not exist or stock is insufficient", async () => {
      // Arrange: Mock insufficient stock
      (prisma.productVariant.findFirst as any).mockResolvedValue({
        id: 99,
        stock: 1, // Wants 2, only has 1
      });

      // Act
      const result = await createOrder(mockUserId, mockOrderData, mockItems);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("غير متوفر بالكمية المطلوبة");
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
          totalAmount: 500,
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
      const result = await getUserOrders(mockUserId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.orders![0].id).toBe(1);
      expect(result.orders![0].status).toBe("DELIVERED");
      expect(result.orders![0].items[0].name).toBe("Perfume A");
    });
  });

  describe("getAllOrders (Admin)", () => {
    it("should return orders if user is ADMIN", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue({
        user: { role: "ADMIN" },
      });
      (prisma.order.findMany as any).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      // Act
      const result = await getAllOrders();

      // Assert
      expect(result.success).toBe(true);
      expect(result.orders).toHaveLength(2);
    });

    it("should return unauthorized if user is not ADMIN or not logged in", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue({
        user: { role: "USER" },
      });

      // Act
      const result = await getAllOrders();

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain("Unauthorized");
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });
  });

  describe("updateOrderStatus", () => {
    it("should update status and increment stock if status changed to CANCELLED", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue({
        user: { role: "ADMIN" },
      });

      const existingOrder = {
        id: 5,
        status: "PENDING",
        items: [{ productId: 1, size: "50ml", quantity: 2 }],
      };

      (prisma.order.findUnique as any).mockResolvedValue(existingOrder);

      // Mock finding the variant to restock
      (prisma.productVariant.findFirst as any).mockResolvedValue({ id: 99 });

      // Act
      const result = await updateOrderStatus(5, "CANCELLED");

      // Assert
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { status: "CANCELLED" },
      });

      // Verify stock was incremented (restocked)
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { stock: { increment: 2 } },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/admin/orders");
      expect(result.success).toBe(true);
    });

    it("should just update status without touching stock if status is NOT CANCELLED", async () => {
      // Arrange
      (auth.api.getSession as any).mockResolvedValue({
        user: { role: "ADMIN" },
      });

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

      // Verify stock update was NEVER called
      expect(prisma.productVariant.update).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
