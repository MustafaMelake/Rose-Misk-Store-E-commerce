import React, { useContext, useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";

// 1. تعريف واجهة المنتج (Interface)
interface ProductType {
  id: number;
  name: string;
  image: string[];
  description: string;
  price: number;
  size: string[];
  company: string; // تأكد إنها string
  rating: number;
  reviews: number;
  // أضف أي حقول تانية ظهرت في الـ Error لو محتاجها
  category?: string;
  Subcategory?: string;
}
const Product: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // تعريف نوع الـ Param
  const context = useContext(ShopContext);

  // حماية الـ Context
  if (!context) return null;

  const { products, currency, addToCart, getPriceBySize } = context;

  // 2. تعريف الـ States مع الأنواع
  const [productItem, setProductItem] = useState<ProductType | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [added, setAdded] = useState<boolean>(false);

  const handleAdd = () => {
    if (!selectedSize) {
      setError("Please select a size first");
      return;
    }

    if (productItem) {
      addToCart(productItem.id, selectedSize);
      setError("");
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const item = products.find((p) => p.id === Number(id));
      if (item) {
        setProductItem({
          ...item,
          // هنا بنضمن إن لو مفيش شركة، يحط نص فاضي أو اسم المحل عشان الـ TS ميزعلش
          company: item.company || "Rose Misk",
          rating: item?.rating || 0,
          reviews: item?.reviews || 0,
        });
        setSelectedSize(null);
      }
    }
    window.scrollTo(0, 0);
  }, [id, products]);

  // 3. استخدام useMemo للمنتجات ذات الصلة لتحسين الأداء
  const relatedProducts = useMemo(() => {
    if (!productItem) return [];
    return products
      .filter(
        (p: any) => p.company === productItem.company && p.id !== productItem.id
      )
      .slice(0, 4);
  }, [products, productItem]);

  if (!productItem) {
    return (
      <div className="py-20 text-center animate-pulse text-gray-500">
        Loading exquisite fragrance...
      </div>
    );
  }

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={"full" + i} className="text-gold-base text-xl">
            ★
          </span>
        ))}
        {halfStar && (
          <span className="text-gold-base text-xl text-[1.3rem]">★</span>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <span
            key={"empty" + i}
            className="text-gray-300 dark:text-zinc-700 text-xl"
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="py-10 animate-fadeIn container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Left Side: Image Gallery */}
        <div className="w-full space-y-4">
          <div className="overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-900 aspect-square">
            <img
              src={productItem.image[0]}
              alt={productItem.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="flex flex-col">
          <p className="text-gold-base font-medium tracking-widest uppercase text-sm mb-2">
            {productItem.company}
          </p>
          <h1 className="text-4xl prata-regular mb-4 dark:text-white">
            {productItem.name}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            {renderStars(productItem.rating)}
            <span className="text-gray-400 text-sm">
              {productItem.rating.toFixed(1)} | {productItem.reviews} Verified
              Reviews
            </span>
          </div>

          <div className="h-[1px] bg-gray-100 dark:bg-zinc-800 w-full mb-6"></div>

          <p className="text-gray-600 dark:text-zinc-400 leading-relaxed mb-8 text-lg">
            {productItem.description}
          </p>

          {/* Price Section */}
          <div className="mb-8">
            <p className="text-sm text-gray-400 uppercase mb-1">
              Current Price
            </p>
            <p className="text-4xl font-bold text-gold-base">
              {currency}
              {selectedSize
                ? getPriceBySize(productItem.id, selectedSize).toFixed(2)
                : productItem.price.toFixed(2)}
            </p>
          </div>

          {/* Sizes Selection */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <p className="font-bold uppercase text-xs tracking-widest dark:text-white">
                Select Volume
              </p>
              {error && (
                <span className="text-red-500 text-xs animate-bounce font-bold">
                  {error}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {productItem.size.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSelectedSize(s);
                    setError("");
                  }}
                  className={`min-w-[80px] py-3 px-4 rounded-xl border-2 transition-all duration-300 font-medium ${
                    selectedSize === s
                      ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg"
                      : "border-gray-100 dark:border-zinc-800 hover:border-gold-base dark:text-zinc-400"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleAdd}
            disabled={added}
            className={`w-full py-5 rounded-2xl text-lg font-bold tracking-widest transition-all duration-500 shadow-2xl ${
              added
                ? "bg-gold-dark-20 text-white translate-y-[-2px]"
                : "bg-black dark:bg-gold-base text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gold-light-20"
            }`}
          >
            {added ? "ADDED TO COLLECTION ✓" : "ADD TO CART"}
          </button>
        </div>
      </div>

      {/* Recommended Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-32">
          <div className="flex flex-col items-center mb-12">
            <h2 className="text-3xl prata-regular mb-2 dark:text-white">
              More from {productItem.company}
            </h2>
            <div className="w-20 h-1 bg-gold-base"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p: any) => (
              <ProductItem
                key={p.id}
                id={p.id}
                image={p.image}
                name={p.name}
                price={p.price}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
