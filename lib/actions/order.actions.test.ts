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

// 1. Mocking Prisma
vi.mock("../prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => await callback(prisma)),
    productVariant: { findFirst: vi.fn(), update: vi.fn() },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cartItem: { deleteMany: vi.fn() },
  },
}));

vi.mock("../auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Order Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUserId = "user_123";

  // ==========================================
  // 1. اختبار دالة createOrder
  // ==========================================
  describe("createOrder", () => {
    const mockOrderData = {
      customerName: "مصطفى",
      customerEmail: "m@example.com",
      customerPhone: "01000000000",
      address: "القاهرة",
      paymentMethod: "COD",
    };
    const mockItems = [{ id: 1, size: "50ml", quantity: 2 }];

    it("يجب أن ينشئ الطلب بنجاح ويخصم المخزون ويحسب التكلفة (+80 توصيل)", async () => {
      (prisma.productVariant.findFirst as any).mockResolvedValue({
        id: 101,
        productId: 1,
        volume: "50ml",
        price: 100,
        stock: 10,
      });

      (prisma.order.create as any).mockResolvedValue({ id: 500 });

      const result = await createOrder(mockUserId, mockOrderData, mockItems);

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalAmount: 280,
            status: "PENDING",
          }),
        })
      );

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { stock: { decrement: 2 } },
      });

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });

      expect(result.success).toBe(true);
      expect(result.orderId).toBe(500);
    });

    it("يجب أن يفشل إذا كانت الكمية المطلوبة غير متوفرة في المخزن", async () => {
      (prisma.productVariant.findFirst as any).mockResolvedValue({
        id: 101,
        stock: 1,
      });

      const result = await createOrder(mockUserId, mockOrderData, mockItems);

      expect(result.success).toBe(false);
      expect(result.message).toContain("غير متوفر بالكمية المطلوبة");
      expect(prisma.order.create).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // 2. اختبار دالة getUserOrders
  // ==========================================
  describe("getUserOrders", () => {
    it("يجب أن يجلب طلبات المستخدم وينسق التاريخ بشكل صحيح (en-GB)", async () => {
      const mockDate = new Date("2026-04-25T10:00:00Z");
      (prisma.order.findMany as any).mockResolvedValue([
        {
          id: 1,
          createdAt: mockDate,
          status: "PENDING",
          paymentMethod: "CARD",
          totalAmount: 300,
          items: [
            {
              productId: 1,
              size: "50ml",
              quantity: 1,
              price: 220,
              product: { name: "عطر", images: ["img.jpg"] },
            },
          ],
        },
      ]);

      const result = await getUserOrders(mockUserId);

      expect(result.success).toBe(true);
      expect(result.orders![0].date).toContain("25");
      expect(result.orders![0].items[0].name).toBe("عطر");
    });
  });

  // ==========================================
  // 3. اختبار دالة getAllOrders (للآدمن)
  // ==========================================
  describe("getAllOrders", () => {
    it("يجب أن يرفض الوصول إذا لم يكن المستخدم ADMIN", async () => {
      // محاكاة يوزر عادي (USER)
      (auth.api.getSession as any).mockResolvedValue({
        user: { role: "USER" },
      });

      const result = await getAllOrders();

      expect(result.success).toBe(false);
      expect(result.message).toContain("Unauthorized");
      expect(prisma.order.findMany).not.toHaveBeenCalled();
    });

    it("يجب أن يجلب الطلبات إذا كان المستخدم ADMIN", async () => {
      // محاكاة آدمن
      (auth.api.getSession as any).mockResolvedValue({
        user: { role: "ADMIN" },
      });
      (prisma.order.findMany as any).mockResolvedValue([]);

      const result = await getAllOrders();

      expect(result.success).toBe(true);
      expect(prisma.order.findMany).toHaveBeenCalled();
    });
  });

  // ==========================================
  // 4. اختبار دالة updateOrderStatus
  // ==========================================
  describe("updateOrderStatus", () => {
    const orderId = 5;

    beforeEach(() => {
      (auth.api.getSession as any).mockResolvedValue({
        user: { role: "ADMIN" },
      });
    });

    it("يجب أن يحدث حالة الطلب إلى SHIPPED بشكل طبيعي", async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: orderId,
        status: "PAID",
        items: [],
      });

      const result = await updateOrderStatus(orderId, "SHIPPED");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: "SHIPPED" },
      });
      expect(result.success).toBe(true);
    });

    it("يجب أن يسترجع الكميات (Stock Increment) إذا تم إلغاء الطلب (CANCELLED)", async () => {
      (prisma.order.findUnique as any).mockResolvedValue({
        id: orderId,
        status: "PENDING",
        items: [{ productId: 1, size: "50ml", quantity: 3 }],
      });

      (prisma.productVariant.findFirst as any).mockResolvedValue({ id: 99 });

      const result = await updateOrderStatus(orderId, "CANCELLED");

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: orderId },
        data: { status: "CANCELLED" },
      });

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: { stock: { increment: 3 } },
      });

      expect(result.success).toBe(true);
      expect(revalidatePath).toHaveBeenCalled();
    });
  });
});
