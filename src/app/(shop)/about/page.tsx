"use client";

import React from "react";
import Image from "next/image";
import Footer from "@/components/Footer";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.1, 0.25, 1.0] as any,
    },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, x: -20 },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
    },
  },
};

const About: React.FC = () => {
  return (
    <>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-16 px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]"
      >
        {/* HEADER */}
        <motion.div
          variants={itemVariants}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <h1 className="text-4xl md:text-5xl font-semibold prata-regular text-gold-base mb-6 tracking-tight">
            About Us
          </h1>
          <div className="w-16 h-[2px] bg-gold-base mx-auto mb-6"></div>{" "}
          <p className="text-gray-600 leading-relaxed dark:text-gray-300 text-lg">
            Discover our story, our passion, and why we love creating
            exceptional fragrances.
          </p>
        </motion.div>

        {/* IMAGE + TEXT SECTION */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* IMAGE WITH ZOOM EFFECT */}
          <motion.div
            variants={imageVariants}
            className="relative group overflow-hidden rounded-2xl shadow-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3"
          >
            <div className="overflow-hidden rounded-xl">
              <Image
                src={"/about-img.webp"}
                alt="Rose Misk Brand Logo"
                width={500}
                height={300}
                priority
                className="w-full h-auto object-contain transition duration-1000 ease-in-out group-hover:scale-110"
              />
            </div>
          </motion.div>

          {/* TEXT CONTENT WITH SEQUENTIAL FADE */}
          <motion.div variants={containerVariants} className="space-y-8">
            <motion.div variants={itemVariants}>
              <h2 className="text-3xl font-semibold prata-regular text-gold-light-20 border-l-4 border-gold-base pl-6 py-1">
                Our Story
              </h2>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="text-gray-600 leading-loose dark:text-gray-300 text-lg"
            >
              We started with a simple vision: to bring high–quality fragrances
              that express personality, elegance, and confidence. Each perfume
              we craft is inspired by a unique moment.
            </motion.p>

            <motion.p
              variants={itemVariants}
              className="text-gray-600 leading-loose dark:text-gray-300 text-lg"
            >
              Our passion is to create long–lasting scents with premium
              ingredients—carefully blended to give you a luxurious experience
              at a fair price.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-r-xl border-l-2 border-gold-base/30 italic text-gray-500 dark:text-gray-400"
            >
              "From day one, our mission has been delivering exceptional quality
              and unmatched value. Your style is our inspiration."
            </motion.div>
          </motion.div>
        </div>

        {/* VALUES SECTION */}
        <motion.div
          variants={containerVariants}
          className="mt-32 grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <ValueCard
            index={0}
            title="Premium Quality"
            description="Every product is crafted from hand–selected ingredients to ensure lasting performance."
          />
          <ValueCard
            index={1}
            title="Affordable Luxury"
            description="Luxury shouldn't be out of reach. We deliver exceptional fragrances at accessible prices."
          />
          <ValueCard
            index={2}
            title="Customer First"
            description="Your satisfaction guides everything we do—from creation to delivery and support."
          />
        </motion.div>
      </motion.div>
      <Footer />
    </>
  );
};

interface ValueCardProps {
  title: string;
  description: string;
  index: number;
}

const ValueCard: React.FC<ValueCardProps> = ({ title, description, index }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{
      y: -10,
      transition: { duration: 0.3 },
    }}
    className="p-10 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-zinc-800 group relative overflow-hidden"
  >
    <span className="absolute -right-4 -top-4 text-9xl font-bold text-gray-50 dark:text-zinc-800 pointer-events-none group-hover:text-gold-base/5 transition-colors duration-500">
      0{index + 1}
    </span>

    <div className="relative z-10">
      <h3 className="text-2xl font-semibold mb-4 text-zinc-800 dark:text-gold-light-20 group-hover:text-gold-base transition-colors duration-300">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-md">
        {description}
      </p>
    </div>
  </motion.div>
);

export default About;
