import React, { useState } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

// 1. تعريف شكل بيانات الـ Form
interface LoginState {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  // 2. تحديد نوع الـ State بناءً على الواجهة (Interface)
  const [form, setForm] = useState<LoginState>({
    email: "",
    password: "",
  });

  // 3. تحديد نوع الـ Event لمدخلات النص
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // TypeScript هيتأكد إن الـ name هو فعلاً "email" أو "password"
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 4. تحديد نوع الـ Event عند إرسال الفورم
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Login Data:", form);
    // هنا بيتم الربط مع الـ Backend (Auth Service)
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800">
        {/* Logo or Brand Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-gold-base/10 rounded-full flex items-center justify-center">
            <LogIn className="text-gold-base" size={28} />
          </div>
        </div>

        <h2 className="text-3xl prata-regular text-gold-base text-center mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
          Enter your details to access your account
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-400 uppercase ml-1">
              Email Address
            </label>
            <input
              required
              type="email"
              name="email"
              value={form.email}
              placeholder="name@example.com"
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base focus:ring-1 focus:ring-gold-base outline-none transition-all dark:text-gray-200"
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-medium text-gray-400 uppercase">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-gold-base hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <input
              required
              type="password"
              name="password"
              value={form.password}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:border-gold-base focus:ring-1 focus:ring-gold-base outline-none transition-all dark:text-gray-200"
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 mt-2 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:bg-gold-base hover:text-black dark:hover:bg-gold-light-20 transition-all duration-300 shadow-lg shadow-gold-base/10"
          >
            Login
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

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-gold-base font-semibold hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
