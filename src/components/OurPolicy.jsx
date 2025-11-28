import React from "react";
import { GitCompareArrows, Headset } from "lucide-react";
import { CircleCheckBig } from "lucide-react";

const OurPolicy = () => {
  return (
    <div className="flex flex-col sm:flex-row justify-around gap-12 sm:gap-2 text-center py-20 text-xs sm:text-sm md:text-base text-gray-700 dark:text-white">
      <div>
        <GitCompareArrows size={36} className=" mx-auto mb-3" />
        <p className="font-semibold">Easy Exchange Policy </p>
        <p className="text-gray-400 ">We offer hassle free exchange</p>
      </div>
      <div>
        <CircleCheckBig size={36} className=" mx-auto mb-3" />
        <p className="font-semibold">7 Day Return Policy</p>
        <p className="text-gray-400">We provide 7 day return policy</p>
      </div>
      <div>
        <Headset size={36} className="mx-auto mb-3" />
        <p className="font-semibold">Best Customer Support </p>
        <p className="text-gray-400">We provide 24/7 customer support </p>
      </div>
    </div>
  );
};

export default OurPolicy;
