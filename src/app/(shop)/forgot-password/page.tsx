"use client";

import React, { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Footer from "@/components/Footer";

/**
 * Forgot-password entry (G5). Sends a Better Auth reset link to the given
 * email; the link points at `/reset-password?token=…`. We always show the same
 * success state regardless of whether the email exists, to avoid leaking which
 * addresses are registered (account-enumeration defence).
 */
const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_ENABLED !== "false";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Better Auth returns success even for unknown emails; we mirror that and
    // never branch the UI on the result, so no address is confirmed or denied.
    await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    setSent(true);
    setLoading(false);
  };

  return (
    <>
      <div
        className="flex justify-center items-center min-h-[80vh] px-4 py-10 animate-fadeIn"
        dir="rtl"
      >
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800">
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                  <MailCheck className="text-emerald-500" size={30} />
                </div>
              </div>
              <h2 className="text-2xl prata-regular text-gold-base mb-2">
                تحقق من بريدك
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
                إذا كان هناك حساب مرتبط بهذا البريد، فسنرسل إليه رابطاً لإعادة
                تعيين كلمة المرور.
              </p>
              {!emailEnabled && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-4">
                  ملاحظة: خدمة البريد غير مفعّلة في هذه البيئة، لذلك لن تصل رسالة
                  فعلية.
                </p>
              )}
              <Link
                href="/login"
                className="inline-block mt-4 text-sm text-gold-base font-semibold hover:underline"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-gold-base/10 rounded-full flex items-center justify-center">
                  <KeyRound className="text-gold-base" size={26} />
                </div>
              </div>
              <h2 className="text-3xl prata-regular text-gold-base text-center mb-2">
                نسيت كلمة المرور؟
              </h2>
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
                أدخل بريدك الإلكتروني وسنرسل إليك رابطاً لإعادة تعيين كلمة المرور.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-400 uppercase">
                    البريد الإلكتروني
                  </label>
                  <input
                    required
                    type="email"
                    dir="ltr"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none transition-all dark:text-gray-200 text-right"
                  />
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-3 mt-2 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
                </button>
              </form>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
                تذكّرت كلمة المرور؟{" "}
                <Link
                  href="/login"
                  className="text-gold-base font-semibold hover:underline"
                >
                  تسجيل الدخول
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ForgotPassword;
