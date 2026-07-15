"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
<<<<<<< HEAD

interface SubmitReviewInput {
  productId: number;
  userId: string;
=======
import { requireUser, requireAdmin, toPublicMessage } from "@/lib/auth-guards";

interface SubmitReviewInput {
  productId: number;
>>>>>>> client-release
  rating: number;
  comment?: string;
}

export async function submitReview({
  productId,
<<<<<<< HEAD
  userId,
=======
>>>>>>> client-release
  rating,
  comment,
}: SubmitReviewInput) {
  try {
<<<<<<< HEAD
=======
    // Identity comes from the session — a client can no longer post a
    // review as an arbitrary user id.
    const user = await requireUser();

>>>>>>> client-release
    if (rating < 1 || rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5." };
    }

<<<<<<< HEAD
    const newReview = await prisma.review.create({
      data: {
        productId: productId,
        userId: userId,
=======
    // Only customers who actually received the product may review it.
    const deliveredPurchase = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: "DELIVERED",
        items: { some: { productId } },
      },
      select: { id: true },
    });

    if (!deliveredPurchase) {
      return {
        success: false,
        error: "You can only review products from a delivered order.",
      };
    }

    await prisma.review.create({
      data: {
        productId: productId,
        userId: user.id,
>>>>>>> client-release
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
<<<<<<< HEAD
    if (error.code === "P2002") {
=======
    if (error?.code === "P2002") {
>>>>>>> client-release
      return {
        success: false,
        error: "You have already submitted a review for this product.",
      };
    }
<<<<<<< HEAD
    return { success: false, error: "Failed to submit review." };
=======
    console.error("submitReview error:", error);
    return {
      success: false,
      error: toPublicMessage(error, "Failed to submit review."),
    };
>>>>>>> client-release
  }
}

export async function approveReview(reviewId: string, productId: number) {
  try {
<<<<<<< HEAD
=======
    await requireAdmin();

>>>>>>> client-release
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
<<<<<<< HEAD
    return { success: false, error: "Failed to approve review." };
=======
    console.error("approveReview error:", error);
    return {
      success: false,
      error: toPublicMessage(error, "Failed to approve review."),
    };
>>>>>>> client-release
  }
}

export async function declineReview(reviewId: string) {
  try {
<<<<<<< HEAD
=======
    await requireAdmin();

>>>>>>> client-release
    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED" },
    });

    revalidatePath(`/admin/reviews`);

    return { success: true, message: "Review declined." };
  } catch (error) {
<<<<<<< HEAD
    return { success: false, error: "Failed to decline review." };
=======
    console.error("declineReview error:", error);
    return {
      success: false,
      error: toPublicMessage(error, "Failed to decline review."),
    };
>>>>>>> client-release
  }
}

export async function getPendingReviews() {
  try {
<<<<<<< HEAD
=======
    await requireAdmin();

>>>>>>> client-release
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
