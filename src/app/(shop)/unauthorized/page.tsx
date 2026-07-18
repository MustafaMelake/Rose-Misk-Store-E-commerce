import React from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Access Denied",
};

/**
 * Access-denied page (G15). The admin layout redirects a signed-in NON-admin
 * here instead of bouncing them silently to the home page, so the invisible
 * RBAC wall becomes a clear explanation with a way forward.
 */
export default function UnauthorizedPage() {
  return (
    <>
      <div className="flex justify-center items-center min-h-[80vh] px-4 py-10 animate-fadeIn">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center">
              <ShieldAlert className="text-red-500" size={30} />
            </div>
          </div>
          <h2 className="text-2xl prata-regular text-gold-base mb-2">
            You don&apos;t have access
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            This page is for store admins only. Your account doesn&apos;t have
            the permissions needed to access the dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/"
              className="w-full py-3 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-all"
            >
              Back to the store
            </Link>
            <Link
              href="/orders"
              className="w-full py-3 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
