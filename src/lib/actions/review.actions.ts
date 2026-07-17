"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin, toPublicMessage } from "@/lib/auth-guards";
import { reviewInputSchema } from "@/lib/validations";

export async function submitReview(input: unknown) {
  try {
    // Identity comes from the session — a client can no longer post a
    // review as an arbitrary user id.
    const user = await requireUser();

    // Validate untrusted input at the boundary (positive productId, integer
    // rating 1–5, comment trimmed & length-capped).
    const parsed = reviewInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "بيانات التقييم غير صالحة.",
      };
    }
    const { productId, rating, comment } = parsed.data;

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
        error: "يمكنك تقييم المنتجات من الطلبات التي تم توصيلها فقط.",
      };
    }

    await prisma.review.create({
      data: {
        productId: productId,
        userId: user.id,
        rating: rating,
        // Comment is optional (column is nullable): store the trimmed text or
        // null when it is empty/omitted.
        comment: comment && comment.length > 0 ? comment : null,
        status: "PENDING",
      },
    });

    return {
      success: true,
      message: "تم إرسال تقييمك وهو قيد مراجعة الإدارة.",
    };
  } catch (error: any) {
    if (error?.code === "P2002") {
      return {
        success: false,
        error: "لقد قمت بتقييم هذا المنتج من قبل.",
      };
    }
    console.error("submitReview error:", error);
    return {
      success: false,
      error: toPublicMessage(error, "تعذّر إرسال التقييم."),
    };
  }
}

export async function approveReview(reviewId: string, productId: number) {
  try {
    await requireAdmin();

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
    return { success: true, message: "تم اعتماد التقييم بنجاح." };
  } catch (error) {
    console.error("approveReview error:", error);
    return {
      success: false,
      error: toPublicMessage(error, "تعذّر اعتماد التقييم."),
    };
  }
}

export async function declineReview(reviewId: string) {
  try {
    await requireAdmin();

    await prisma.review.update({
      where: { id: reviewId },
      data: { status: "REJECTED" },
    });

    revalidatePath(`/admin/reviews`);

    return { success: true, message: "تم رفض التقييم." };
  } catch (error) {
    console.error("declineReview error:", error);
    return {
      success: false,
      error: toPublicMessage(error, "تعذّر رفض التقييم."),
    };
  }
}

export async function getPendingReviews() {
  try {
    await requireAdmin();

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
