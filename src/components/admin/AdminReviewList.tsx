"use client";

import { useState } from "react";
import {
  approveReview,
  declineReview,
} from "../../../lib/actions/review.actions";
import Image from "next/image";
import { renderStars } from "@/components/Stars";

export default function AdminReviewList({
  initialReviews,
}: {
  initialReviews: any[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (
    id: string,
    productId: number,
    action: "approve" | "decline"
  ) => {
    setProcessingId(id);
    const res =
      action === "approve"
        ? await approveReview(id, productId)
        : await declineReview(id);

    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert(res.error);
    }
    setProcessingId(null);
  };

  return (
    <div className="grid gap-6">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-gray-50 dark:bg-zinc-900/50 border border-border rounded-2xl p-5 flex flex-col md:flex-row gap-6 items-start transition-all hover:shadow-md"
        >
          {/* Product Info */}
          <div className="flex items-center gap-4 min-w-[200px]">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-100">
              <Image
                src={review.product.images[0] || "/placeholder.png"}
                alt="Product"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-xs text-gold-base font-bold uppercase tracking-tighter">
                Product
              </p>
              <p className="text-sm font-semibold dark:text-white line-clamp-1">
                {review.product.name}
              </p>
            </div>
          </div>

          {/* Review Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              {renderStars(review.rating)}
              <span className="text-xs text-gray-400">
                by {review.user?.name || "Unknown User"}
              </span>
            </div>
            <p className="text-gray-700 dark:text-zinc-300 text-sm leading-relaxed">
              "{review.comment || "No comment provided."}"
            </p>
            <p className="text-[10px] text-gray-400 uppercase">
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() =>
                handleAction(review.id, review.productId, "approve")
              }
              disabled={processingId === review.id}
              className="flex-1 md:flex-none px-6 py-2.5 bg-gold-base hover:bg-gold-dark-20 text-black text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              {processingId === review.id ? "..." : "APPROVE"}
            </button>
            <button
              onClick={() =>
                handleAction(review.id, review.productId, "decline")
              }
              disabled={processingId === review.id}
              className="flex-1 md:flex-none px-6 py-2.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-black dark:text-white text-xs font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              DECLINE
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
