"use client";

import React, { useContext, useMemo } from "react";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { ShopContext } from "../context/ShopContext";

const LatestCollection = () => {
  const context = useContext(ShopContext);

  // 1. لو الـ Context مش موجود، نخرج بدري عشان ميحصلش Crash
  if (!context) {
    return null;
  }

  const { products } = context;

  // 2. استخدام useMemo بدلاً من useState و useEffect
  // ده بيخلي الكود أنضف وبيرتب المنتجات بس لما قائمة المنتجات الأصلية تتغير
  const latestProducts = useMemo(() => {
    return products && products.length > 0 ? products.slice(0, 10) : [];
  }, [products]);

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTIONS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300">
          Discover our newest fragrances, crafted with passion and elegance.
        </p>
      </div>

      {/* 3. عرض المنتجات */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {latestProducts.length > 0 ? (
          latestProducts.map((item) => {
            // حساب أقل سعر متاح للمنتج من الـ variants
            const minPrice =
              item.variants && item.variants.length > 0
                ? Math.min(...item.variants.map((v) => v.price))
                : 0;

            return (
              <ProductItem
                key={item.id}
                id={item.id}
                image={item.images} // مصفوفة الصور كاملة
                name={item.name}
                price={minPrice}
                currency="EGP"
              />
            );
          })
        ) : (
          // حالة انتظار البيانات أو عدم وجود منتجات
          <div className="col-span-full text-center py-10 text-gray-400">
            No products found.
          </div>
        )}
      </div>
    </div>
  );
};

export default LatestCollection;
