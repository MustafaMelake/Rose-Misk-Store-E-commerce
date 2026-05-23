"use client";

import { useState } from "react";
import { submitReview } from "../../lib/actions/review.actions";

interface ReviewModalProps {
  productId: number;
  userId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({
  productId,
  userId,
  productName,
  isOpen,
  onClose,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    success: boolean;
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setStatusMessage({
        success: false,
        text: "الرجاء اختيار تقييم بالنجوم أولاً.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await submitReview({
      productId,
      userId,
      rating,
      comment,
    });

    setIsSubmitting(false);

    if (result.success) {
      setStatusMessage({
        success: true,
        text: "تم إرسال تقييمك بنجاح وقيد مراجعة الإدارة حالياً.",
      });
      setRating(0);
      setComment("");
      // نقفل المودال بعد ثانيتين عشان يشوف رسالة النجاح
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 2500);
    } else {
      setStatusMessage({
        success: false,
        text: result.error || "حدث خطأ أثناء إرسال التقييم.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      {/* الخلفية لقفل المودال عند الضغط خارجاً */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* صندوق المودال الاحترافي */}
      <div className="relative w-full max-w-md md:max-w-lg bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* رأس المودال بالخط السيريف الفخم */}
        <div className="text-center mb-6">
          <h3 className="prata-regular text-2xl md:text-3xl text-black dark:text-white mb-2">
            شاركنا رأيك
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            تقييمك لمنتج:{" "}
            <span className="font-semibold text-black dark:text-white">
              {productName}
            </span>
          </p>
        </div>

        {statusMessage?.success ? (
          /* واجهة النجاح */
          <div className="flex flex-col items-center justify-center py-8 text-center animate-scale-up">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100 px-4">
              {statusMessage.text}
            </p>
          </div>
        ) : (
          /* فورم التقييم */
          <form
            onSubmit={handleSubmit}
            className="space-y-5 text-right"
            dir="rtl"
          >
            {/* اختيار النجوم التفاعلي */}
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <label className="text-sm font-medium text-muted-foreground mb-1">
                انقر لاختيار التقييم
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((index) => {
                  const currentStars = hoverRating || rating;
                  const isFilled = index <= currentStars;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setRating(index)}
                      onMouseEnter={() => setHoverRating(index)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="cursor-pointer scale-100 hover:scale-115 active:scale-95 transition-all duration-150"
                    >
                      <svg
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        className={
                          isFilled
                            ? "text-gold-base"
                            : "text-gray-200 dark:text-zinc-700"
                        }
                        fill={isFilled ? "currentColor" : "none"}
                        stroke={isFilled ? "none" : "currentColor"}
                        strokeWidth="1.5"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* صندوق النص */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-black-light dark:text-zinc-300">
                اكتب تعليقك (اختياري)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="ما هي تجربتك مع هذا العطر؟ ثباته، فوحانه..."
                rows={4}
                className="inputStyle resize-none text-right placeholder:text-gray-400 dark:bg-zinc-900 dark:border-zinc-800 dark:focus:border-gold-base"
                maxLength={500}
              />
            </div>

            {/* رسائل الخطأ إن وجدت */}
            {statusMessage && !statusMessage.success && (
              <p className="text-sm text-destructive text-center font-medium bg-destructive/10 p-3 rounded-xl">
                {statusMessage.text}
              </p>
            )}

            {/* زراير التحكم */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-black text-white dark:bg-white dark:text-black py-3 px-4 rounded-xl font-medium cursor-pointer transition-all hover:bg-black-light dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-center flex justify-center items-center"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  "إرسال التقييم"
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-3 border border-border rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
