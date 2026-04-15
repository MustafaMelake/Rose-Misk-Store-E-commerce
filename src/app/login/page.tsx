"use client";
import React, { useState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { authClient } from "../../../lib/auth-client"; // <--- Better Auth Client
import Footer from "@/components/Footer";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Better Auth credentials login
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
      callbackURL: "/", // Where to redirect after success
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
              <FaGoogle className="text-red-500" />
              <span className="text-sm font-medium">Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin("facebook")}
              className="flex items-center justify-center gap-2 p-3 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
            >
              <FaFacebook className="text-blue-600" />
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
