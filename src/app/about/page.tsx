import React from "react";
import { assets } from "../../assets/assets";
import Image from "next/image";
import Footer from "@/components/Footer";

const About: React.FC = () => {
  return (
    <>
      <div className="py-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw] animate-fadeIn">
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h1 className="text-3xl font-semibold prata-regular text-gold-base mb-4 tracking-wide">
            About Us
          </h1>
          <p className="text-gray-600 leading-relaxed dark:text-gray-300">
            Discover our story, our passion, and why we love creating
            exceptional fragrances.
          </p>
        </div>

        {/* IMAGE + TEXT SECTION */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
            <Image
              src={assets.Logo}
              alt="Rose Misk Brand Logo"
              width={180}
              height={60}
              priority
              className="w-full h-auto object-contain hover:scale-105 transition duration-700 ease-in-out rounded-xl"
            />
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold prata-regular text-gold-light-20 border-l-4 border-gold-base pl-4">
              Our Story
            </h2>

            <p className="text-gray-600 leading-relaxed dark:text-gray-300">
              We started with a simple vision: to bring high–quality fragrances
              that express personality, elegance, and confidence. Each perfume
              we craft is inspired by a unique moment, a memory, or a feeling
              that deserves to be captured.
            </p>

            <p className="text-gray-600 leading-relaxed dark:text-gray-300">
              Our passion is to create long–lasting scents with premium
              ingredients—carefully blended to give you a luxurious experience
              at a fair price.
            </p>

            <p className="text-gray-600 leading-relaxed dark:text-gray-300 italic">
              "From day one, our mission has been delivering exceptional quality
              and unmatched value. Your style is our inspiration."
            </p>
          </div>
        </div>

        {/* VALUES SECTION */}
        <div className="mt-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          <ValueCard
            title="Premium Quality"
            description="Every product is crafted from hand–selected ingredients to ensure lasting performance."
          />
          <ValueCard
            title="Affordable Luxury"
            description="Luxury shouldn't be out of reach. We deliver exceptional fragrances at accessible prices."
          />
          <ValueCard
            title="Customer First"
            description="Your satisfaction guides everything we do—from creation to delivery and support."
          />
        </div>
      </div>
      <Footer />
    </>
  );
};

// مكون فرعي صغير (Sub-component) لزيادة التنظيم في TypeScript
interface ValueCardProps {
  title: string;
  description: string;
}

const ValueCard: React.FC<ValueCardProps> = ({ title, description }) => (
  <div className="p-8 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 dark:border-zinc-800 group">
    <h3 className="text-xl font-semibold mb-3 text-gold-light-20 group-hover:text-gold-base transition-colors">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
      {description}
    </p>
  </div>
);

export default About;
