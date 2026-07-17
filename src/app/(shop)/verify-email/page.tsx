"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck, MailWarning, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Footer from "@/components/Footer";

/**
 * Email-verification landing (G7). Reached right after sign-up and from the
 * "resend" link on the login screen. It reconciles two worlds:
 *   • Verification REQUIRED (mailer configured) → no session yet → show a
 *     "check your inbox" state with a resend button.
 *   • Verification NOT required (no mailer) → sign-up already created a session
 *     → show an "account ready" state. No silent lock-out either way.
 */
const VerifyEmail = () => {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");

  // When explicitly disabled, surface a clear localized note instead of a
  // dead "check your inbox" screen that will never receive a mail.
  const emailEnabled = process.env.NEXT_PUBLIC_EMAIL_ENABLED !== "false";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEmail(params.get("email") ?? "");
  }, []);

  const isVerified = Boolean(session?.user);

  const handleResend = async () => {
    if (!email) {
      setNotice("لا يوجد بريد إلكتروني لإعادة الإرسال إليه.");
      return;
    }
    setResending(true);
    setNotice("");
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/verify-email",
      });
      setNotice("تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.");
    } catch {
      setNotice("تعذّر إرسال الرابط الآن. برجاء المحاولة لاحقاً.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <div
        className="flex justify-center items-center min-h-[80vh] px-4 py-10 animate-fadeIn"
        dir="rtl"
      >
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800 text-center">
          {isPending ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 text-gold-base animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                جارٍ التحقق من حالة حسابك...
              </p>
            </div>
          ) : isVerified ? (
            /* ---------- Account ready ---------- */
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
                  <MailCheck className="text-emerald-500" size={30} />
                </div>
              </div>
              <h2 className="text-2xl prata-regular text-gold-base mb-2">
                حسابك جاهز
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                تم تفعيل حسابك بنجاح. يمكنك الآن متابعة التسوّق.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/"
                  className="w-full py-3 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-all"
                >
                  العودة للمتجر
                </Link>
                <Link
                  href="/orders"
                  className="w-full py-3 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  طلباتي
                </Link>
              </div>
            </>
          ) : (
            /* ---------- Verification pending ---------- */
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 bg-gold-base/10 rounded-full flex items-center justify-center">
                  <MailWarning className="text-gold-base" size={30} />
                </div>
              </div>
              <h2 className="text-2xl prata-regular text-gold-base mb-2">
                أكّد بريدك الإلكتروني
              </h2>

              {emailEnabled ? (
                <>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    لقد أرسلنا رابط تأكيد إلى
                  </p>
                  <p className="text-sm font-semibold dark:text-white mb-6 break-all">
                    {email || "بريدك الإلكتروني"}
                  </p>
                  <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                    افتح الرسالة واضغط على رابط التأكيد لتفعيل حسابك. لم تصلك
                    الرسالة؟ تحقق من مجلد الرسائل غير المرغوب فيها أو أعد الإرسال.
                  </p>

                  {notice && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-4">
                      {notice}
                    </p>
                  )}

                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="w-full py-3 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 mb-3"
                  >
                    {resending ? "جارٍ الإرسال..." : "إعادة إرسال رابط التأكيد"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                  خدمة البريد الإلكتروني غير مفعّلة في هذه البيئة، لذا تم تفعيل
                  حسابك تلقائياً. يمكنك تسجيل الدخول مباشرةً.
                </p>
              )}

              <Link
                href="/login"
                className="inline-block text-sm text-gold-base font-semibold hover:underline"
              >
                العودة لتسجيل الدخول
              </Link>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default VerifyEmail;
