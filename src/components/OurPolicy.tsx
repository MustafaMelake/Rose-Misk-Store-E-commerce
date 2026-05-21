import React from "react";
import { Milestone, ShieldCheck, Hourglass } from "lucide-react";

const OurPolicy: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700 dark:text-white">
      {/* 95% Match Ratio */}
      <div className="transition-transform hover:scale-105 max-w-xs mx-auto sm:mx-0">
        <Milestone size={36} className="mx-auto mb-3 text-gold-base" />
        <p className="font-semibold text-base sm:text-lg mb-1">
          95%+ Scent Match
        </p>
        <p className="text-gray-400 dark:text-gray-300 leading-relaxed px-4 sm:px-0">
          Crafted with premium French oils to precisely mirror the exact notes,
          projection, and luxury of the world’s most iconic fragrances.
        </p>
      </div>

      {/* Certified & Safe */}
      <div className="transition-transform hover:scale-105 max-w-xs mx-auto sm:mx-0">
        <ShieldCheck size={36} className="mx-auto mb-3 text-gold-base" />
        <p className="font-semibold text-base sm:text-lg mb-1">
          100% Skin Safe
        </p>
        <p className="text-gray-400 dark:text-gray-300 leading-relaxed px-4 sm:px-0">
          Formulated with high-grade, certified medical-standard solvents. Pure,
          non-allergenic, and perfectly safe for direct skin contact.
        </p>
      </div>

      {/* Longevity Guaranteed */}
      <div className="transition-transform hover:scale-105 max-w-xs mx-auto sm:mx-0">
        <Hourglass
          size={36}
          className="mx-auto mb-3 text-gold-base animate-pulse"
        />
        <p className="font-semibold text-base sm:text-lg mb-1">
          Exceptional Longevity
        </p>
        <p className="text-gray-400 dark:text-gray-300 leading-relaxed px-4 sm:px-0">
          Blended at true Eau de Parfum concentrations, ensuring your favorite
          signature scent lingers elegantly on skin and fabrics all day.
        </p>
      </div>
    </div>
  );
};

export default OurPolicy;
