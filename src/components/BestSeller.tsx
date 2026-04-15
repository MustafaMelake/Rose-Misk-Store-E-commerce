"use client";

import React, { useContext, useMemo } from "react";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { ShopContext } from "../context/ShopContext";

const BestSeller = () => {
  const context = useContext(ShopContext);

  // لو الـ Context مش موجود نخرج بدري
  if (!context) return null;

  const { products } = context;

  // فلترة المنتجات عشان نجيب الـ Best Sellers بس
  const bestSellers = useMemo(() => {
    return products.filter((item) => item.isFeatured).slice(0, 5);
  }, [products]);

  // لو مفيش منتجات مميزة لسه، ممكن نخفي القسم خالص
  if (bestSellers.length === 0) return null;

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"BEST"} text2={"SELLERS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 dark:text-white">
          Discover our most-loved fragrances. Hand-picked scents that have
          become signature favorites for our exclusive community.
        </p>
      </div>

      {/* عرض المنتجات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {bestSellers.map((item) => {
          // حساب أقل سعر من الـ variants
          const minPrice =
            item.variants.length > 0
              ? Math.min(...item.variants.map((v) => v.price))
              : 0;

          return (
            <ProductItem
              key={item.id}
              id={item.id}
              image={item.images}
              name={item.name}
              price={minPrice}
              currency={"EGP"}
            />
          );
        })}
      </div>
    </div>
  );
};

export default BestSeller;
