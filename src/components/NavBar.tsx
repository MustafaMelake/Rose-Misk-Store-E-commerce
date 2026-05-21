"use client";

import React, { useContext, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  User,
  ShoppingBag,
  Menu,
  ArrowLeft,
  Sun,
  Moon,
  LogOut,
  Package,
  LayoutDashboard,
} from "lucide-react";
import { ShopContext } from "../context/ShopContext";
import { ThemeContext } from "./ThemeContext";
import { authClient } from "../../lib/auth-client";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";

const NavBar: React.FC = () => {
  const [isOpen, SetIsOpen] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const [isMounted, setIsMounted] = useState<boolean>(false);

  const [hidden, setHidden] = useState<boolean>(false);

  const pathname = usePathname();
  const router = useRouter();

  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN";

  const shopContext = useContext(ShopContext);
  const themeContext = useContext(ThemeContext);

  const userRef = useRef<HTMLDivElement>(null);
  const sideRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();

    if (previous !== undefined) {
      if (latest > previous && latest > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
    }
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        open &&
        userRef.current &&
        !userRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
      if (
        isOpen &&
        sideRef.current &&
        !sideRef.current.contains(e.target as Node)
      ) {
        SetIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, isOpen]);

  if (!shopContext) return null;
  const { setSearchOpen, getCartCount } = shopContext;
  const theme = themeContext?.theme;
  const toggleTheme = themeContext?.toggleTheme;

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/login");
          setOpen(false);
        },
      },
    });
  };

  const NavItem = ({
    href,
    label,
    onClick,
  }: {
    href: string;
    label: string;
    onClick?: () => void;
  }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex flex-col gap-1 items-center transition-colors ${
          isActive ? "text-gold-base" : "text-black dark:text-white"
        }`}
      >
        <p className="text-xs sm:text-sm">{label}</p>
        {isActive && (
          <hr className="w-2/4 border-none h-[1.5px] bg-gold-base" />
        )}
      </Link>
    );
  };

  return (
    <motion.div
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="flex items-center justify-between py-5 font-medium sticky top-0 z-50 bg-white dark:bg-black px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] border-b border-slate-100 dark:border-zinc-900"
    >
      <Link href="/">
        <span className="text-2xl sm:text-3xl text-gold-base prata-regular uppercase tracking-widest">
          ROSE MISK
        </span>
      </Link>

      {/* DESKTOP MENU */}
      <ul className="hidden sm:flex gap-5 text-sm">
        <NavItem href="/" label="HOME" />
        <NavItem href="/fragrances" label="FRAGRANCES" />
        <NavItem href="/about" label="ABOUT" />
        <NavItem href="/contact" label="CONTACT" />
      </ul>

      {/* RIGHT ICONS */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Search
          className="w-5 cursor-pointer dark:text-white hover:text-gold-base transition-colors"
          onClick={() => setSearchOpen(true)}
        />

        {/* USER MENU */}
        <div className="relative" ref={userRef}>
          <div
            className="flex items-center gap-1 cursor-pointer group"
            onClick={() => setOpen((prev) => !prev)}
          >
            <User className="w-5 dark:text-white group-hover:text-gold-base transition-colors" />
            {session && (
              <span className="hidden md:block text-xs dark:text-white max-w-[80px] truncate">
                {session.user.name.split(" ")[0]}
              </span>
            )}
          </div>

          {open && (
            <div className="absolute right-0 top-full pt-4 animate-in fade-in zoom-in duration-200">
              <div className="flex flex-col gap-1 w-48 py-3 px-2 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-xl rounded-lg">
                {session ? (
                  <>
                    <div className="px-3 py-2 border-b border-slate-50 dark:border-zinc-800 mb-1">
                      <p className="text-xs text-gray-400">Account</p>
                      <p className="text-sm font-semibold dark:text-white truncate">
                        {session.user.email}
                      </p>
                    </div>

                    {isAdmin ? (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gold-base hover:bg-slate-50 dark:hover:bg-zinc-800 rounded transition-colors"
                        onClick={() => setOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> Dashboard
                      </Link>
                    ) : (
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 rounded transition-colors dark:text-gray-200"
                        onClick={() => setOpen(false)}
                      >
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-zinc-800 rounded transition-colors dark:text-gray-200"
                    onClick={() => setOpen(false)}
                  >
                    Login / Sign Up
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* CART */}
        <Link href="/cart" className="relative group">
          <ShoppingBag className="w-5 dark:text-white group-hover:text-gold-base transition-colors" />
          <p className="text-white dark:text-black rounded-full absolute right-[-5px] bottom-[-5px] w-4 h-4 text-[8px] flex items-center justify-center bg-black dark:bg-white border border-white dark:border-black">
            {isMounted ? getCartCount : 0}
          </p>
        </Link>

        {/* THEME TOGGLE */}
        <button
          onClick={toggleTheme}
          className="hover:scale-110 transition-transform"
        >
          {theme === "dark" ? (
            <Sun className="w-5 text-gold-base" />
          ) : (
            <Moon className="w-5" />
          )}
        </button>

        <Menu
          className="cursor-pointer w-5 sm:hidden dark:text-white"
          onClick={() => SetIsOpen(true)}
        />
      </div>

      {/* MOBILE SIDEBAR */}
      <div
        ref={sideRef}
        className={`fixed top-0 right-0 bottom-0 overflow-hidden bg-white dark:bg-black transition-all duration-300 ${
          isOpen ? "w-[70%]" : "w-0"
        } z-50 border-l dark:border-zinc-800 shadow-2xl`}
      >
        <div className="flex flex-col text-gray-600 dark:text-white h-full">
          <div
            onClick={() => SetIsOpen(false)}
            className="flex items-center gap-4 p-6 cursor-pointer border-b dark:border-zinc-800"
          >
            <ArrowLeft className="h-4" />
            <p className="font-semibold text-sm">BACK</p>
          </div>
          <div className="flex flex-col gap-6 p-8">
            <NavItem href="/" label="HOME" onClick={() => SetIsOpen(false)} />
            <NavItem
              href="/fragrances"
              label="FRAGRANCES"
              onClick={() => SetIsOpen(false)}
            />
            <NavItem
              href="/about"
              label="ABOUT"
              onClick={() => SetIsOpen(false)}
            />
            <NavItem
              href="/contact"
              label="CONTACT"
              onClick={() => SetIsOpen(false)}
            />

            <hr className="border-zinc-100 dark:border-zinc-800" />
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => SetIsOpen(false)}
                className="text-sm font-medium text-gold-base"
              >
                ADMIN DASHBOARD
              </Link>
            ) : (
              <Link
                href="/orders"
                onClick={() => SetIsOpen(false)}
                className="text-sm"
              >
                MY ORDERS
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NavBar;
