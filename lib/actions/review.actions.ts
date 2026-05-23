"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

interface SubmitReviewInput {
  productId: number;
  userId: string;
  rating: number;
  comment?: string;
}

export async function submitReview({
  productId,
  userId,
  rating,
  comment,
}: SubmitReviewInput) {
  try {
    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5." };
    }

    const newReview = await prisma.review.create({
      data: {
        productId: productId,
        userId: userId,
        rating: rating,
        comment: comment?.trim() || null,
        status: "PENDING",
      },
    });

    return {
      success: true,
      message: "Review submitted and is pending admin approval.",
    };
  } catch (error: any) {
    if (error.code === "P2002") {
      return {
        success: false,
        error: "You have already submitted a review for this product.",
      };
    }
    return { success: false, error: "Failed to submit review." };
  }
}

export async function approveReview(reviewId: string, productId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { status: "APPROVED" },
      });

      const approvedReviews = await tx.review.findMany({
        where: {
          productId: productId,
          status: "APPROVED",
        },
        select: { rating: true },
      });

      const reviewsCount = approvedReviews.length;

      const totalStars = approvedReviews.reduce((sum, r) => sum + r.rating, 0);

      const averageRating = parseFloat((totalStars / reviewsCount).toFixed(1));

      await tx.product.update({
        where: { id: productId },
        data: {
          rating: averageRating,
          reviewsCount: reviewsCount,
        },
      });
    });
    revalidatePath(`/product/${productId}`);
    revalidatePath(`/admin/reviews`);
    return { success: true, message: "Review approved successfully." };
  } catch (error) {
    return { success: false, error: "Failed to approve review." };
  }
}

export async function declineReview(reviewId: string) {
  try {
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED" },
    });

    revalidatePath(`/admin/reviews`);

    return { success: true, message: "Review declined." };
  } catch (error) {
    return { success: false, error: "Failed to decline review." };
  }
}

export async function getPendingReviews() {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: "PENDING" },
      include: {
        product: { select: { name: true, images: true } },
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return reviews;
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return [];
  }
}

export async function getApprovedProductReviews(productId: number) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId: productId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: { name: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, reviews };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return { success: false, error: "Failed to fetch reviews", reviews: [] };
  }
}
