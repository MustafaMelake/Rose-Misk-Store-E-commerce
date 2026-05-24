import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  submitReview,
  approveReview,
  declineReview,
  getPendingReviews,
  getApprovedProductReviews,
} from "./review.actions"; // Adjust the path if necessary
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

// 1. Mock Prisma and Transaction
vi.mock("../prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      return await callback(prisma);
    }),
    review: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    product: {
      update: vi.fn(),
    },
  },
}));

// 2. Mock Next.js Cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Review Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitReview", () => {
    const validPayload = {
      productId: 1,
      userId: "user_123",
      rating: 5,
      comment: " Excellent product! ",
    };

    it("should create a pending review on valid input and trim comments", async () => {
      (prisma.review.create as any).mockResolvedValue({ id: "rev_1" });

      const result = await submitReview(validPayload);

      expect(prisma.review.create).toHaveBeenCalledWith({
        data: {
          productId: 1,
          userId: "user_123",
          rating: 5,
          comment: "Excellent product!", // Verifying the trim() worked
          status: "PENDING",
        },
      });
      expect(result.success).toBe(true);
      expect(result.message).toContain("pending admin approval");
    });

    it("should return an error if rating is less than 1 or greater than 5", async () => {
      const resultLow = await submitReview({ ...validPayload, rating: 0 });
      const resultHigh = await submitReview({ ...validPayload, rating: 6 });

      expect(resultLow.success).toBe(false);
      expect(resultLow.error).toBe("Rating must be between 1 and 5.");

      expect(resultHigh.success).toBe(false);
      expect(resultHigh.error).toBe("Rating must be between 1 and 5.");

      expect(prisma.review.create).not.toHaveBeenCalled();
    });

    it("should return a specific error message on P2002 duplicate constraint", async () => {
      // Simulate Prisma Unique Constraint Error
      const prismaError = new Error("Unique constraint");
      (prismaError as any).code = "P2002";
      (prisma.review.create as any).mockRejectedValue(prismaError);

      const result = await submitReview(validPayload);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "You have already submitted a review for this product."
      );
    });
  });

  describe("approveReview", () => {
    it("should update review status, recalculate averages, update product, and revalidate paths", async () => {
      // Arrange: Mock the updated review
      (prisma.review.update as any).mockResolvedValue({
        id: "rev_1",
        status: "APPROVED",
      });

      // Arrange: Mock existing approved reviews to test the math logic
      // Math: (4 + 5 + 4) / 3 = 13 / 3 = 4.333... -> toFixed(1) -> 4.3
      (prisma.review.findMany as any).mockResolvedValue([
        { rating: 4 },
        { rating: 5 },
        { rating: 4 },
      ]);

      // Act
      const result = await approveReview("rev_1", 100);

      // Assert: Verify review update
      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: "rev_1" },
        data: { status: "APPROVED" },
      });

      // Assert: Verify average rating math and product update
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          rating: 4.3,
          reviewsCount: 3,
        },
      });

      // Assert: Verify revalidation
      expect(revalidatePath).toHaveBeenCalledWith("/product/100");
      expect(revalidatePath).toHaveBeenCalledWith("/admin/reviews");

      expect(result.success).toBe(true);
    });

    it("should return false on transaction failure", async () => {
      (prisma.review.update as any).mockRejectedValue(
        new Error("DB Connection Lost")
      );

      const result = await approveReview("rev_1", 100);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to approve review.");
    });
  });

  describe("declineReview", () => {
    it("should update review status to REJECTED and revalidate paths", async () => {
      (prisma.review.update as any).mockResolvedValue({ id: "rev_1" });

      const result = await declineReview("rev_1");

      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: "rev_1" },
        data: { status: "REJECTED" },
      });
      expect(revalidatePath).toHaveBeenCalledWith("/admin/reviews");
      expect(result.success).toBe(true);
    });
  });

  describe("getPendingReviews", () => {
    it("should fetch all pending reviews ordered by creation date", async () => {
      const mockReviews = [{ id: "rev_1", status: "PENDING" }];
      (prisma.review.findMany as any).mockResolvedValue(mockReviews);

      const result = await getPendingReviews();

      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { status: "PENDING" },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual(mockReviews);
    });
  });

  describe("getApprovedProductReviews", () => {
    it("should fetch approved reviews for a specific product ID", async () => {
      const mockReviews = [{ id: "rev_1", rating: 5 }];
      (prisma.review.findMany as any).mockResolvedValue(mockReviews);

      const result = await getApprovedProductReviews(100);

      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { productId: 100, status: "APPROVED" },
        include: expect.any(Object),
        orderBy: { createdAt: "desc" },
      });
      expect(result.success).toBe(true);
      expect(result.reviews).toEqual(mockReviews);
    });
  });
});
