import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategories } from "./category.actions"; // تأكد من صحة المسار
import { prisma } from "../prisma";

vi.mock("../prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
  },
}));

describe("Category Actions - getCategories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("يجب أن يعيد جميع الأقسام مرتبة أبجدياً عند النجاح", async () => {
    // تجهيز بيانات وهمية
    const mockCategories = [
      { id: 1, name: "عطور رجالى" },
      { id: 2, name: "عطور حريمى" },
      { id: 3, name: "عطور يونسكس" },
    ];

    (prisma.category.findMany as any).mockResolvedValue(mockCategories);

    const result = await getCategories();

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: "asc" },
    });

    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCategories);
  });

  it("يجب أن يعيد رسالة خطأ واضحة عند فشل الاتصال بقاعدة البيانات", async () => {
    const errorMessage = "Database Connection Timeout";

    (prisma.category.findMany as any).mockRejectedValue(
      new Error(errorMessage)
    );

    const result = await getCategories();

    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
    expect(result.data).toBeUndefined();
  });

  it("يجب أن يعيد رسالة خطأ افتراضية إذا لم يتوفر وصف للخطأ", async () => {
    (prisma.category.findMany as any).mockRejectedValue({});

    const result = await getCategories();

    expect(result.success).toBe(false);
    expect(result.error).toBe("حدث خطأ ما");
  });
});
