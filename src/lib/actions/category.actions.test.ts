import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategories } from "./category.actions";
import { prisma } from "@/lib/prisma";

// 1. Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
  },
}));

// 2. Mock the auth guards for toPublicMessage (masks raw errors).
vi.mock("@/lib/auth-guards", () => {
  class PublicError extends Error {}
  return {
    PublicError,
    toPublicMessage: (e: any, fb = "An unexpected error occurred.") =>
      e instanceof PublicError ? e.message : fb,
  };
});

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

    it("should mask the raw DB error behind a generic message", async () => {
      // Arrange
      (prisma.category.findMany as any).mockRejectedValue(
        new Error("Database connection failed")
      );

      // Act
      const result = await getCategories();

      // Assert: the raw message must NOT leak to the client.
      expect(result.success).toBe(false);
      expect(result.error).toBe("Something went wrong.");
      expect(result.error).not.toBe("Database connection failed");
    });
  });
});
