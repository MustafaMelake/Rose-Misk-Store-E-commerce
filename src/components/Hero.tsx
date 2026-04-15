import React from "react";
import Link from "next/link";
import { assets } from "../assets/assets";
import Image from "next/image";

const Hero: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row border border-black dark:border-gray-800 mt-10">
      {/* Left Side */}
      <div className="w-full sm:w-1/2 flex items-center justify-center py-10 sm:py-0">
        <div className="text-gold-base">
          <div className="flex items-center gap-2">
            <p className="w-8 md:w-11 h-[2px] bg-black dark:bg-gray-800"></p>
            <p className="font-medium text-sm md:text-base">BEST SELLER</p>
          </div>

          <h1 className="prata-regular text-3xl sm:py-3 lg:text-5xl leading-relaxed">
            Latest Arrivals
          </h1>
          <Link
            href="/fragrances"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all"
          >
            <button
              onClick={() => (window.location.href = "/fragrances")}
              className="px-8 py-3 bg-black dark:bg-gold-base text-white dark:text-black uppercase text-xs tracking-[0.2em] font-bold hover:opacity-80 transition-all"
            >
              Start Shopping
            </button>
          </Link>
        </div>
      </div>
      {/* Right Side */}
      <div className="relative aspect-[2/1] w-full overflow-hidden">
        <Image
          src={assets.HeroIMG}
          alt="Rose Misk | Exquisite Naxos-Inspired Fragrances Promotional Banner"
          fill
          priority
          sizes="(max-width: 640px) 100vw, 100vw"
          className="w-full sm:w-1/2 object-cover"
        />
      </div>
    </div>
  );
};

export default Hero;
