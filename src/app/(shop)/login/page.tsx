"use client";
import React, { useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaFacebook } from "react-icons/fa";
import { authClient } from "../../../../lib/auth-client";
import Footer from "@/components/Footer";

// أيقونة جوجل الأصلية
const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await authClient.signIn.email({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    await authClient.signIn.social({
      provider: provider,
      callbackURL: "/",
    });
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-[80vh] px-4 animate-fadeIn py-10">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gold-base/10 rounded-full flex items-center justify-center">
              <LogIn className="text-gold-base" size={28} />
            </div>
          </div>

          <h2 className="text-3xl prata-regular text-gold-base text-center mb-2">
            Welcome Back
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
            Enter details to access your account
          </p>

          {error && (
            <p className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm text-center mb-4 border border-red-100 dark:border-red-900/30">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* ... (نفس كود الايميل والباسورد بتاعك بدون تغيير) ... */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase ml-1">
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="name@example.com"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none transition-all dark:text-gray-200"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between px-1">
                <label className="text-xs font-medium text-gray-400 uppercase">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-gold-base hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none transition-all dark:text-gray-200"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 mt-2 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "جاري تسجيل الدخول..." : "Login"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-zinc-800"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialLogin("google")}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
            >
              <GoogleIcon /> {/* ⬅️ استخدمنا الـ SVG هنا */}
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin("facebook")}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
            >
              <FaFacebook className="text-blue-600 text-xl" />
              <span className="text-sm font-medium">Facebook</span>
            </button>
          </div>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-gold-base font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
