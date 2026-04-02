import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { Product } from "../assets/assets"; // استيراد الـ Type اللي عملناه

const BestSeller: React.FC = () => {
  // 1. استخدام الـ Context مع التأكد إنه موجود
  const context = useContext(ShopContext);
  
  // تعريف الـ State مع تحديد إنه مصفوفة من نوع Product
  const [bestSellers, setBestSellers] = useState<Product[]>([]);

  useEffect(() => {
    if (context && context.products) {
      // فلترة المنتجات التي تحمل علامة bestSeller فقط
      const bestProduct = context.products.filter((item) => item.bestSeller);
      setBestSellers(bestProduct.slice(0, 5));
    }
  }, [context]); // تحديث القائمة لو الـ products اتغيرت

  if (!context) return null;

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"BEST"} text2={"SELLERS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 dark:text-white">
          Discover our most-loved fragrances. Hand-picked scents that have become 
          signature favorites for our exclusive community.
        </p>
      </div>

      {/* Rendering Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {bestSellers.map((item) => (
          <ProductItem
            key={item.id}
            id={item.id}
            image={item.image}
            name={item.name}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default BestSeller;