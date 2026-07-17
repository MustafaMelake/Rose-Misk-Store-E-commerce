"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Footer from "@/components/Footer";

/**
 * Reset-password screen (G5). Reached from the tokenized link in the reset
 * email (`/reset-password?token=…`). Validates the two password fields, then
 * calls Better Auth's `resetPassword`; on success it sends the user to login.
 */
const ResetPassword = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Better Auth may redirect here with `?error=INVALID_TOKEN` instead of a token.
    if (params.get("error")) {
      setToken(null);
    } else {
      setToken(params.get("token"));
    }
    setTokenChecked(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }
    if (!token) {
      setError("رابط إعادة التعيين غير صالح أو منتهي الصلاحية.");
      return;
    }

    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({
      newPassword: form.password,
      token,
    });
    setLoading(false);

    if (resetError) {
      setError("تعذّر إعادة تعيين كلمة المرور. قد يكون الرابط منتهي الصلاحية.");
    } else {
      router.push("/login?reset=success");
    }
  };

  const invalidLink = tokenChecked && !token;

  return (
    <>
      <div
        className="flex justify-center items-center min-h-[80vh] px-4 py-10 animate-fadeIn"
        dir="rtl"
      >
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gold-base/10 rounded-full flex items-center justify-center">
              <LockKeyhole className="text-gold-base" size={26} />
            </div>
          </div>
          <h2 className="text-3xl prata-regular text-gold-base text-center mb-2">
            كلمة مرور جديدة
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
            اختر كلمة مرور جديدة وقوية لحسابك.
          </p>

          {invalidLink ? (
            <div className="text-center">
              <p className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm mb-6 border border-red-100 dark:border-red-900/30">
                رابط إعادة التعيين غير صالح أو منتهي الصلاحية.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block text-sm text-gold-base font-semibold hover:underline"
              >
                طلب رابط جديد
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <p className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm text-center mb-4 border border-red-100 dark:border-red-900/30">
                  {error}
                </p>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-400 uppercase">
                    كلمة المرور الجديدة
                  </label>
                  <input
                    required
                    type="password"
                    dir="ltr"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none transition-all dark:text-gray-200 text-right"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-400 uppercase">
                    تأكيد كلمة المرور
                  </label>
                  <input
                    required
                    type="password"
                    dir="ltr"
                    placeholder="••••••••"
                    value={form.confirm}
                    onChange={(e) =>
                      setForm({ ...form, confirm: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none transition-all dark:text-gray-200 text-right"
                  />
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full py-3 mt-2 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ResetPassword;
