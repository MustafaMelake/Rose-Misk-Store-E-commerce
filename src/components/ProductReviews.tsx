"use client";

import { useEffect, useState } from "react";
import { getApprovedProductReviews } from "../../lib/actions/review.actions";
import { renderStars } from "@/components/Stars";
import { MessageSquare, ChevronDown } from "lucide-react";

export default function ProductReviews({ productId }: { productId: number }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [visibleCount, setVisibleCount] = useState<number>(4);

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

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  return (
    <div className="mt-24 border-t border-gray-100 dark:border-zinc-800 pt-16">
      <div className="flex flex-col items-center mb-12">
        <h2 className="text-3xl prata-regular mb-2 dark:text-white">
          Customer Reviews
        </h2>
        <div className="w-20 h-1 bg-gold-base"></div>
      </div>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-zinc-900/30 border border-dashed border-gray-200 dark:border-zinc-800">
          <MessageSquare className="w-12 h-12 text-gray-300 dark:text-zinc-700 mb-4" />
          <p className="text-gray-500 dark:text-zinc-400 font-medium">
            No reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white dark:bg-zinc-900/80 p-5 border border-gray-100 dark:border-zinc-800/80 hover:border-gold-base/30 dark:hover:border-gold-base/30 transition-colors duration-300 flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    {/* تصغير حجم الـ Avatar لـ w-8 h-8 */}
                    <div className="w-8 h-8 rounded-full bg-gold-light-20 dark:bg-zinc-800 flex items-center justify-center text-gold-base font-bold text-xs uppercase shrink-0">
                      {review.user?.name?.charAt(0) || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-bold dark:text-white line-clamp-1">
                        {review.user?.name || "Verified Customer"}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                        {new Date(review.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* النجوم ومسافة بسيطة */}
                <div className="mb-3 scale-90 origin-left">
                  <div className="flex">{renderStars(review.rating)}</div>
                </div>

                {/* نص التقييم */}
                <p className="text-gray-600 dark:text-zinc-400 text-xs leading-relaxed italic flex-grow">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>

          {/* زرار Show More */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount((prev) => prev + 4)}
                className="group flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 dark:border-zinc-700 text-sm font-medium text-black dark:text-white hover:border-gold-base dark:hover:border-gold-base hover:text-gold-base dark:hover:text-gold-base transition-all duration-300 cursor-pointer bg-transparent"
              >
                Show More
                <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-300" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
