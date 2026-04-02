import React from "react";
import { GitCompareArrows, Headset, CircleCheckBig } from "lucide-react";

const OurPolicy: React.FC = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700 dark:text-white">
      {/* Exchange Policy */}
      <div className="transition-transform hover:scale-105">
        <GitCompareArrows size={36} className="mx-auto mb-3 text-gold-base" />
        <p className="font-semibold">Easy Exchange Policy</p>
        <p className="text-gray-400 dark:text-gray-300">
          We offer a hassle-free exchange on all fragrances.
        </p>
      </div>

      {/* Return Policy */}
      <div className="transition-transform hover:scale-105">
        <CircleCheckBig size={36} className="mx-auto mb-3 text-gold-base" />
        <p className="font-semibold">7-Day Return Policy</p>
        <p className="text-gray-400 dark:text-gray-300">
          Peace of mind with our 7-day return guarantee.
        </p>
      </div>

      {/* Support Policy */}
      <div className="transition-transform hover:scale-105">
        <Headset size={36} className="mx-auto mb-3 text-gold-base" />
        <p className="font-semibold">Expert Customer Support</p>
        <p className="text-gray-400 dark:text-gray-300">
          Professional assistance for your scent selection 24/7.
        </p>
      </div>
    </div>
  );
};

export default OurPolicy;
