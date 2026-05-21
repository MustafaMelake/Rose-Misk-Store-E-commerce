"use client";
import React from "react";
import Hero from "../../components/Hero";
import LatestCollection from "../../components/LatestCollection";
import BestSeller from "../../components/BestSeller";
import OurPolicy from "../../components/OurPolicy";
import Footer from "@/components/Footer";

const Home: React.FC = () => {
  return (
    <div className="animate-fadeIn">
      <Hero />
      <LatestCollection />
      <BestSeller />
      <OurPolicy />
      <Footer />
    </div>
  );
};

export default Home;
