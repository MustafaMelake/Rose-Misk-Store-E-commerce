"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function GuestWelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkGuestStatus = async () => {
      const isDismissed = localStorage.getItem("hide-guest-banner");
      if (isDismissed) return;

      try {
        const res = await fetch("/api/auth/get-session");

        if (!res.ok) {
          setTimeout(() => setIsVisible(true), 2000);
          return;
        }

        const sessionData = await res.json();

        if (!sessionData || !sessionData.user) {
          setTimeout(() => setIsVisible(true), 2000);
        }
      } catch (error) {
        console.log("Auth check failed, showing banner as fallback.");
        setTimeout(() => setIsVisible(true), 2000);
      }
    };

    checkGuestStatus();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("hide-guest-banner", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      dir="ltr"
      className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-sm bg-black/95 backdrop-blur-md border border-gold-base/20 text-white p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.7)] z-50 transition-all duration-500 ease-in-out"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-neutral-500 hover:text-gold-light-20 transition-colors text-xs p-1"
        aria-label="Close banner"
      >
        ✕
      </button>

      <div className="space-y-4 pr-2">
        <h3 className="prata-regular text-xl text-gold-base tracking-wider">
          Welcome to Rose Misk
        </h3>

        <p className="text-xs text-neutral-400 font-light leading-relaxed">
          Create an account to seamlessly track your luxury orders, save your
          delivery preferences, and unlock exclusive member privileges.
        </p>

        <div className="flex gap-3 pt-2 w-full">
          {/* ✅ تم تعديل المسار هنا من /register إلى /signup ليطابق الروت بتاعك */}
          <Link
            href="/signup"
            className="flex-1 text-center bg-gold-base hover:bg-gold-light-20 text-black text-xs font-bold py-3 rounded-xl tracking-wide transition-all duration-300 shadow-md shadow-gold-base/10"
          >
            Create Account
          </Link>
          <Link
            href="/login"
            className="flex-1 text-center border border-black-light hover:border-gold-dark-20 text-neutral-300 hover:text-white text-xs font-medium py-3 rounded-xl transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
