import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserCart,
  updateCartInDB,
  clearUserCart,
  mergeCartAction,
} from "./cart.actions"; 
import { prisma } from "../prisma";

// 1. Mock the Prisma Client
vi.mock("../prisma", () => ({
  prisma: {
    cartItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("Cart Server Actions", () => {
  const mockUserId = "user_123";

  // 2. Clear mock history before each test to prevent data leakage between tests
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserCart", () => {
    it("should return formatted cart data on success", async () => {
      // Arrange: Mock Prisma to return an array of cart items
      (prisma.cartItem.findMany as any).mockResolvedValue([
        { productId: 1, size: "50ml", quantity: 2 },
        { productId: 1, size: "100ml", quantity: 1 },
        { productId: 2, size: "Standard", quantity: 5 },
      ]);

      // Act: Call the action
      const result = await getUserCart(mockUserId);

      // Assert: Verify the transformation logic
      expect(prisma.cartItem.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result.success).toBe(true);
      expect(result.cartData).toEqual({
        1: { "50ml": 2, "100ml": 1 },
        2: { Standard: 5 },
      });
    });

    it("should return empty object and success false on database error", async () => {
      // Arrange: Simulate a DB failure
      (prisma.cartItem.findMany as any).mockRejectedValue(
        new Error("DB Error")
      );

      // Act
      const result = await getUserCart(mockUserId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.cartData).toEqual({});
    });
  });

  describe("updateCartInDB", () => {
    it("should delete the item if quantity is 0 or less", async () => {
      // Arrange
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 1 });

      // Act
      const result = await updateCartInDB(mockUserId, 10, "50ml", 0);

      // Assert
      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, productId: 10, size: "50ml" },
      });
      expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should upsert the item if quantity is greater than 0", async () => {
      // Arrange
      (prisma.cartItem.upsert as any).mockResolvedValue({});

      // Act
      const result = await updateCartInDB(mockUserId, 10, "50ml", 3);

      // Assert
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          userId_productId_size: {
            userId: mockUserId,
            productId: 10,
            size: "50ml",
          },
        },
        update: { quantity: 3 },
        create: {
          userId: mockUserId,
          productId: 10,
          size: "50ml",
          quantity: 3,
        },
      });
      expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("should handle errors gracefully", async () => {
      (prisma.cartItem.upsert as any).mockRejectedValue(
        new Error("Network Error")
      );

      const result = await updateCartInDB(mockUserId, 10, "50ml", 3);

      expect(result.success).toBe(false);
    });
  });

  describe("clearUserCart", () => {
    it("should clear all user cart items", async () => {
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 5 });

      const result = await clearUserCart(mockUserId);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result.success).toBe(true);
    });

    it("should return false if deletion fails", async () => {
      (prisma.cartItem.deleteMany as any).mockRejectedValue(
        new Error("Failed")
      );

      const result = await clearUserCart(mockUserId);

      expect(result.success).toBe(false);
    });
  });

  describe("mergeCartAction", () => {
    it("should upsert and increment quantities for all local cart items", async () => {
      // Arrange: A mock local cart state
      const localCart = {
        1: { "50ml": 2 },
        2: { "100ml": 1 },
      };
      (prisma.cartItem.upsert as any).mockResolvedValue({});

      // Act
      const result = await mergeCartAction(mockUserId, localCart);

      // Assert
      expect(result.success).toBe(true);
      expect(prisma.cartItem.upsert).toHaveBeenCalledTimes(2);

      // Check the exact payload sent to Prisma for the first product
      expect(prisma.cartItem.upsert).toHaveBeenNthCalledWith(1, {
        where: {
          userId_productId_size: {
            userId: mockUserId,
            productId: 1,
            size: "50ml",
          },
        },
        update: { quantity: { increment: 2 } },
        create: { userId: mockUserId, productId: 1, size: "50ml", quantity: 2 },
      });
    });

    it("should return false if merging fails", async () => {
      const localCart = { 1: { "50ml": 2 } };
      (prisma.cartItem.upsert as any).mockRejectedValue(
        new Error("Merge error")
      );

      const result = await mergeCartAction(mockUserId, localCart);

      expect(result.success).toBe(false);
    });
  });
});
