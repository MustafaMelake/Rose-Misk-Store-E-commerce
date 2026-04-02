import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { Product } from "../assets/assets"; // استيراد الـ Type لضمان دقة البيانات

const LatestCollection: React.FC = () => {
  // 1. الوصول للـ Context
  const context = useContext(ShopContext);
  const products = context?.products as Product[];

  // 2. تعريف الـ State وتحديد إنه مصفوفة من المنتجات
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (products && products.length > 0) {
      // نستخدم الـ products اللي عملنا لها Casting فوق
      const sorted = [...products].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );
      setLatestProducts(sorted.slice(0, 10));
    }
  }, [products]);

  // حماية في حالة الـ Context مش متوفر
  if (!context) return null;

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTION"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600 dark:text-white">
          Explore our newest olfactory creations. Freshly arrived scents crafted
          for those who seek the extraordinary.
        </p>
      </div>

      {/* Rendering Products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {latestProducts.map((item) => (
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

export default LatestCollection;
