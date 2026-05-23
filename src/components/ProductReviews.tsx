"use client";

import { useEffect, useState } from "react";
import { getApprovedProductReviews } from "../../lib/actions/review.actions";
import { renderStars } from "@/components/Stars";
import { MessageSquare } from "lucide-react";

export default function ProductReviews({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const res = await getApprovedProductReviews(productId);
      if (res.success && res.reviews) {
        setReviews(res.reviews);
      }
      setLoading(false);
    };

    fetchReviews();
  }, [productId]);

  if (loading) {
    return (
      <div className="mt-20 py-10 text-center animate-pulse text-gray-400">
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="mt-24 border-t border-gray-100 dark:border-zinc-800 pt-16">
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-3xl prata-regular mb-2 dark:text-white">
          Customer Reviews
        </h2>
        <div className="w-20 h-1 bg-gold-base"></div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-zinc-800">
          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-zinc-700 mb-4" />
          <p className="text-gray-500 dark:text-zinc-400 font-medium">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {/* User Avatar Initial */}
                  <div className="w-10 h-10 rounded-full bg-gold-light-20 dark:bg-zinc-800 flex items-center justify-center text-gold-base font-bold uppercase">
                    {review.user?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold dark:text-white">
                      {review.user?.name || "Verified Customer"}
                    </p>
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex">{renderStars(review.rating)}</div>
              </div>
              <p className="text-gray-600 dark:text-zinc-400 text-sm leading-relaxed italic">
                "{review.comment}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
