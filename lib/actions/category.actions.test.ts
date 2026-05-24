import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategories } from "./category.actions";
import { prisma } from "../prisma";

// 1. Mock Prisma
vi.mock("../prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
  },
}));

describe("Category Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should return sorted categories on success", async () => {
      // Arrange
      const mockCategories = [
        { id: 1, name: "Fragrances" },
        { id: 2, name: "Skincare" },
      ];
      (prisma.category.findMany as any).mockResolvedValue(mockCategories);

      // Act
      const result = await getCategories();

      // Assert
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCategories);
    });

    it("should return an error object when database query fails", async () => {
      // Arrange
      (prisma.category.findMany as any).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      const result = await getCategories();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
    });
  });
});
