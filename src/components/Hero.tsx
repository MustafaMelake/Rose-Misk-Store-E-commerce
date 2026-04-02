import React from "react";
import { Link } from "react-router-dom"; // استيراد Link للتنقل
import { assets } from "../assets/assets";

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

          {/* تعديل: تحويل النص لرابط ينقلك لصفحة العطور */}
          <Link
            to="/fragrances"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-all"
          >
            <p className="font-semibold text-sm md:text-base">SHOP NOW</p>
            <p className="w-8 md:w-11 h-[2px] bg-black dark:bg-gray-800"></p>
          </Link>
        </div>
      </div>

      {/* Right Side */}
      <img
        src={assets.HeroIMG}
        className="w-full sm:w-1/2 object-cover"
        alt="Rose Misk Hero"
      />
    </div>
  );
};

export default Hero;
