import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createProduct,
  updateProduct,
  getAllProducts,
  searchProducts,
} from "./product.actions";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

vi.mock("../prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => await callback(prisma)),
    product: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    productVariant: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Product Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. اختبار إنشاء المنتج (Logic & Slug)
  // ==========================================
  describe("createProduct", () => {
    const mockProductData = {
      name: "عطر مِسك روز",
      description: "وصف العطر",
      company: "Rose Misk",
      images: ["test.jpg"],
      rating: 5,
      isFeatured: true,
      categoryId: 1,
      slug: "",
      variants: [{ volume: "100ml", price: 500, stock: 10 }],
    };

    it("يجب أن يولد Slug يدعم العربية وينشئ المنتج بنجاح", async () => {
      (prisma.product.create as any).mockResolvedValue({ id: 1 });

      const result = await createProduct(mockProductData);

      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: mockProductData.name,
            slug: expect.stringContaining("عطر-مِسك-روز"),
          }),
        })
      );

      expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
      expect(result.success).toBe(true);
    });
  });

  // ==========================================
  // 2. اختبار تحديث المنتج (Transaction)
  // ==========================================
  describe("updateProduct", () => {
    const productId = 10;
    const updateData = {
      name: "عطر معدل",
      variants: [{ volume: "50ml", price: 300, stock: 5 }],
    };

    it("يجب أن يحذف الـ variants القديمة ثم ينشئ الجديدة بداخل Transaction", async () => {
      (prisma.product.update as any).mockResolvedValue({ id: productId });

      const result = await updateProduct(productId, updateData);

      expect(prisma.productVariant.deleteMany).toHaveBeenCalledWith({
        where: { productId: productId },
      });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: productId },
          data: expect.objectContaining({
            name: "عطر معدل",
            variants: {
              create: [expect.objectContaining({ volume: "50ml" })],
            },
          }),
        })
      );

      expect(result.success).toBe(true);
    });

    it("يجب أن يعيد success: false إذا كان الـ ID غير صالح", async () => {
      const result = await updateProduct(NaN, updateData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("حدث خطأ");
    });
  });

  // ==========================================
  // 3. اختبار جلب المنتجات (Pagination)
  // ==========================================
  describe("getAllProducts", () => {
    it("يجب أن يحسب الـ skip بناءً على رقم الصفحة", async () => {
      (prisma.product.findMany as any).mockResolvedValue([]);

      await getAllProducts(2, 12);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 12,
          take: 12,
        })
      );
    });
  });

  // ==========================================
  // 4. اختبار البحث (Search)
  // ==========================================
  describe("searchProducts", () => {
    it("يجب أن يعيد مصفوفة فارغة إذا كان الاستعلام (query) فارغاً", async () => {
      const result = await searchProducts("   ");
      expect(result).toEqual([]);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it("يجب أن يبحث في الاسم والوصف بدون حساسية لحالة الأحرف (insensitive)", async () => {
      (prisma.product.findMany as any).mockResolvedValue([{ name: "Rose" }]);

      await searchProducts("rose");

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "rose", mode: "insensitive" } },
              { description: { contains: "rose", mode: "insensitive" } },
            ],
          },
        })
      );
    });
  });
});
