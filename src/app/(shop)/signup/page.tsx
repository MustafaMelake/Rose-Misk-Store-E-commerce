"use client";
import React, { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "../../../../lib/auth-client";
import Footer from "@/components/Footer";

const SignUp = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Better Auth handles the user creation entirely
    const { error: signUpError } = await authClient.signUp.email({
      email: form.email,
      password: form.password,
      name: form.name,
    });

    if (signUpError) {
      setError(signUpError.message || "Failed to create account");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <>
      <div className="flex justify-center items-center min-h-[80vh] px-4 py-10 animate-fadeIn">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gold-base/10 rounded-full flex items-center justify-center">
              <UserPlus className="text-gold-base" size={28} />
            </div>
          </div>

          <h2 className="text-3xl prata-regular text-gold-base text-center mb-2">
            Create Account
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
            Join the Rose Misk fragrance community
          </p>

          {error && (
            <p className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-lg text-sm text-center mb-4">
              {error}
            </p>
          )}

          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase">
                Full Name
              </label>
              <input
                required
                type="text"
                placeholder="Name"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none dark:text-gray-200"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase">
                Email Address
              </label>
              <input
                required
                type="email"
                placeholder="name@example.com"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none dark:text-gray-200"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-400 uppercase">
                Password
              </label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base outline-none dark:text-gray-200"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-3 mt-4 bg-gold-base text-black font-bold rounded-xl hover:bg-gold-light transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "جاري إنشاء الحساب..." : "Sign Up"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-8">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-gold-base font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignUp;
