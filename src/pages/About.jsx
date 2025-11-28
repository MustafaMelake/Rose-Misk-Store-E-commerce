import React from "react";
import { assets } from "../assets/assets";

const About = () => {
  return (
    <div className="py-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/* HEADER */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h1 className="text-3xl font-semibold prata-regular text-gold-base mb-4">
          About Us
        </h1>
        <p className="text-gray-600 leading-relaxed dark:text-white">
          Discover our story, our passion, and why we love creating exceptional
          fragrances.
        </p>
      </div>

      {/* IMAGE + TEXT SECTION */}
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <img
            src={assets.Logo}
            alt="About Our Brand"
            className="w-full h-full object-cover hover:scale-105 transition duration-500"
          />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold prata-regular text-gold-light-20 ">
            Our Story
          </h2>

          <p className="text-gray-600 leading-relaxed dark:text-white">
            We started with a simple vision: to bring high–quality fragrances
            that express personality, elegance, and confidence. Each perfume we
            craft is inspired by a unique moment, a memory, or a feeling that
            deserves to be captured.
          </p>

          <p className="text-gray-600 leading-relaxed dark:text-white">
            Our passion is to create long–lasting scents with premium
            ingredients—carefully blended to give you a luxurious experience at
            a fair price.
          </p>

          <p className="text-gray-600 leading-relaxed dark:text-white">
            From day one, our mission has been delivering exceptional quality
            and unmatched value. Your style is our inspiration.
          </p>
        </div>
      </div>

      {/* VALUES SECTION */}
      <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div
          className="  p-8 bg-white dark:bg-black 
  rounded-2xl 
  shadow dark:shadow-none hover:shadow-lg transition
  dark:border dark:border-white/20
"
        >
          <h3 className="text-xl font-semibold mb-3 text-gold-light-20">
            Premium Quality
          </h3>
          <p className="text-gray-600 dark:text-white">
            Every product is crafted from hand–selected ingredients to ensure
            lasting performance.
          </p>
        </div>

        <div
          className="  p-8 bg-white dark:bg-black 
  rounded-2xl 
  shadow dark:shadow-none hover:shadow-lg transition
  dark:border dark:border-white/20
"
        >
          <h3 className="text-xl font-semibold mb-3 text-gold-light-20">
            Affordable Luxury
          </h3>
          <p className="text-gray-600 dark:text-white">
            Luxury shouldn't be out of reach. We deliver exceptional fragrances
            at accessible prices.
          </p>
        </div>

        <div
          className="
  p-8 bg-white dark:bg-black 
  rounded-2xl 
  shadow dark:shadow-none hover:shadow-lg transition
  dark:border dark:border-white/20
"
        >
          <h3 className="text-xl font-semibold mb-3 text-gold-light-20">
            Customer First
          </h3>
          <p className="text-gray-600 dark:text-white">
            Your satisfaction guides everything we do—from creation to delivery
            and support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
