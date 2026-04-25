import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserCart,
  updateCartInDB,
  clearUserCart,
  mergeCartAction,
} from "./cart.actions";
import { prisma } from "../prisma";

vi.mock("../prisma", () => ({
  prisma: {
    cartItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("Cart Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserId = "user_123";

  describe("getUserCart", () => {
    it("يجب أن يجلب بيانات السلة ويعيد تشكيلها بشكل صحيح (نجاح)", async () => {
      const mockDbItems = [
        { productId: 1, size: "50ml", quantity: 2, userId: mockUserId },
        { productId: 1, size: "100ml", quantity: 1, userId: mockUserId },
        { productId: 2, size: "50ml", quantity: 3, userId: mockUserId },
      ];

      (prisma.cartItem.findMany as any).mockResolvedValue(mockDbItems);

      const result = await getUserCart(mockUserId);

      expect(prisma.cartItem.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });

      expect(result.success).toBe(true);
      expect(result.cartData).toEqual({
        "1": { "50ml": 2, "100ml": 1 },
        "2": { "50ml": 3 },
      });
    });

    it("يجب أن يعيد كائن فارغ في حالة حدوث خطأ", async () => {
      (prisma.cartItem.findMany as any).mockRejectedValue(
        new Error("DB Error")
      );

      const result = await getUserCart(mockUserId);

      expect(result.success).toBe(false);
      expect(result.cartData).toEqual({});
    });
  });

  describe("updateCartInDB", () => {
    it("يجب أن يحذف العنصر من السلة إذا كانت الكمية تساوي 0", async () => {
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 1 });

      const result = await updateCartInDB(mockUserId, 1, "50ml", 0);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, productId: 1, size: "50ml" },
      });
      expect(prisma.cartItem.upsert).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it("يجب أن يضيف أو يُحدث العنصر إذا كانت الكمية أكبر من 0", async () => {
      (prisma.cartItem.upsert as any).mockResolvedValue({});

      const result = await updateCartInDB(mockUserId, 1, "50ml", 2);

      expect(prisma.cartItem.upsert).toHaveBeenCalledWith({
        where: {
          userId_productId_size: {
            userId: mockUserId,
            productId: 1,
            size: "50ml",
          },
        },
        update: { quantity: 2 },
        create: { userId: mockUserId, productId: 1, size: "50ml", quantity: 2 },
      });
      expect(result.success).toBe(true);
    });

    it("يجب أن يعيد success: false عند فشل التحديث", async () => {
      (prisma.cartItem.upsert as any).mockRejectedValue(
        new Error("Update failed")
      );

      const result = await updateCartInDB(mockUserId, 1, "50ml", 2);

      expect(result.success).toBe(false);
    });
  });

  describe("clearUserCart", () => {
    it("يجب أن يحذف جميع عناصر السلة للمستخدم بنجاح", async () => {
      (prisma.cartItem.deleteMany as any).mockResolvedValue({ count: 5 });

      const result = await clearUserCart(mockUserId);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result.success).toBe(true);
    });

    it("يجب أن يعيد success: false عند فشل الحذف", async () => {
      (prisma.cartItem.deleteMany as any).mockRejectedValue(
        new Error("Delete failed")
      );

      const result = await clearUserCart(mockUserId);

      expect(result.success).toBe(false);
    });
  });

  describe("mergeCartAction", () => {
    it("يجب أن يدمج السلة المحلية مع قاعدة البيانات بشكل صحيح", async () => {
      (prisma.cartItem.upsert as any).mockResolvedValue({});

      const localCart = {
        "1": { "50ml": 2 },
        "2": { "100ml": 1 },
      };

      const result = await mergeCartAction(mockUserId, localCart);

      expect(prisma.cartItem.upsert).toHaveBeenCalledTimes(2);
      expect(prisma.cartItem.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_productId_size: {
              userId: mockUserId,
              productId: 1,
              size: "50ml",
            },
          },
          update: { quantity: { increment: 2 } },
          create: {
            userId: mockUserId,
            productId: 1,
            size: "50ml",
            quantity: 2,
          },
        })
      );

      expect(result.success).toBe(true);
    });

    it("يجب أن يعيد success: false عند حدوث خطأ أثناء الدمج", async () => {
      (prisma.cartItem.upsert as any).mockRejectedValue(
        new Error("Merge failed")
      );

      const localCart = { "1": { "50ml": 2 } };
      const result = await mergeCartAction(mockUserId, localCart);

      expect(result.success).toBe(false);
    });
  });
});
