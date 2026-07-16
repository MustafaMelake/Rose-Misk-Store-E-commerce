"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const Hero: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col sm:flex-row border border-black dark:border-gray-800 mt-10"
    >
      {/* Left Side */}
      <div className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-gold-base"
        >
          <div className="flex items-center gap-2">
            <p className="w-8 md:w-11 h-[2px] bg-black dark:bg-gray-800"></p>
            <p className="font-medium text-sm md:text-base">BEST SELLER</p>
          </div>

          <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed mb-4">
            Latest Arrivals
          </h1>

          <Link
            href="/fragrances"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all"
          >
            <button className="px-8 py-3 bg-black dark:bg-gold-base text-white dark:text-black uppercase text-xs tracking-[0.2em] font-bold hover:opacity-80 transition-all">
              Start Shopping
            </button>
          </Link>
        </motion.div>
      </div>

      {/* Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className="relative aspect-[2/1] w-full sm:w-1/2 overflow-hidden"
      >
        <Image
          src={"/Hero-img.webp"}
          loading="eager"
          alt="Rose Misk | Exquisite Naxos-Inspired Fragrances Promotional Banner"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
        />
      </motion.div>
    </motion.div>
  );
};

export default Hero;
