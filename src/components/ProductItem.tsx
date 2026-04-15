"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface ProductItemProps {
  id: number;
  image: string[];
  name: string;
  price: number;
  currency: string;
  company?: string;
}

const ProductItem = ({
  id,
  image,
  name,
  price,
  currency,
  company = "ROSE MISK",
}: ProductItemProps) => {
  const hasImages = image && image.length > 0;
  const mainImage = hasImages ? image[0] : "/placeholder.png";
  const hoverImage = hasImages && image.length > 1 ? image[1] : mainImage;

  return (
    <Link
      href={`/product/${id}`}
      className="group flex flex-col cursor-pointer w-full"
    >
  
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50 dark:bg-zinc-900 mb-5">
      
        <Image
          src={mainImage}
          alt={name}
          fill
          className={`object-cover transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105 ${
            image?.length > 1 ? "group-hover:opacity-0" : ""
          }`}
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {image?.length > 1 && (
          <Image
            src={hoverImage}
            alt={`${name} alternate view`}
            fill
            className="absolute inset-0 object-cover opacity-0 transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-105 group-hover:opacity-100"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}

        
        <div className="absolute bottom-0 w-full p-4 translate-y-full opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 hidden md:block">
          <div className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm text-center py-3.5 text-[11px] uppercase tracking-[0.2em] font-medium text-gray-900 dark:text-white shadow-sm">
            Discover
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center text-center px-2">
        <span className="text-[10px] uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400 mb-2">
          {company}
        </span>

        <h3 className="text-sm md:text-base font-medium text-gray-900 dark:text-white line-clamp-1 mb-1.5 group-hover:text-gold-base transition-colors duration-300">
          {name}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-300 tracking-wide">
          {currency}{" "}
          {price.toLocaleString("en-US", { minimumFractionDigits: 0 })}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
