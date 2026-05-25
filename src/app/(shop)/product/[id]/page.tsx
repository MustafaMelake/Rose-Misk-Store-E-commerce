"use client";

import React, { useContext, useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { ShopContext } from "../../../../context/ShopContext";
import ProductItem from "../../../../components/ProductItem";
import { renderStars } from "../../../../components/Stars";
import Footer from "@/components/Footer";
import { authClient } from "../../../../../lib/auth-client";
import ReviewModal from "@/components/ReviewModal";
import ProductReviews from "@/components/ProductReviews";

interface ProductType {
  id: number;
  name: string;
  images: string[];
  description: string;
  price: number;
  size: string[];
  company: string;
  rating: number;
  reviews: number;
  variants: { volume: string; price: number; stock: number }[];
  category?: string;
  Subcategory?: string;
}

const Product: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const context = useContext(ShopContext);

  if (!context) return null;

  const { products, currency, addToCart, getPriceBySize } = context;
  const [productItem, setProductItem] = useState<ProductType | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [added, setAdded] = useState<boolean>(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);

  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

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
      const item = products.find((p) => Number(p.id) === Number(id));
      if (item) {
        const defaultPrice = item.variants?.[0]?.price || 0;

        setProductItem({
          ...item,
          price: defaultPrice,
          images: item.images || [],
          company: item.company || "Rose Misk",
          rating: (item as any).rating || 0,
          reviews: (item as any).reviewsCount || 0,
          size: item.variants ? item.variants.map((v: any) => v.volume) : [],
        });
        setSelectedSize(null);
      }
    }
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [id, products]);

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

  const selectedVariant = productItem.variants?.find(
    (v) => v.volume === selectedSize
  );
  const isOutOfStock = selectedVariant
    ? Number(selectedVariant.stock) <= 0
    : false;

  return (
    <>
      <div className="py-10 animate-fadeIn container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left Side: Image Gallery */}
          <div className="w-full space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-900 aspect-square">
              <Image
                src={productItem.images?.[0] || "/placeholder.png"}
                alt={productItem.name || "Product image"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
                priority
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

            {/* 🌟 3. تعديل منطقة التقييم لإضافة زرار "Write a Review" */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                {renderStars(productItem.rating)}
                <span className="text-gray-600 dark:text-zinc-400 font-medium text-sm">
                  {productItem.rating.toFixed(1)}
                  <span className="ml-1 opacity-70">
                    ({productItem.reviews})
                  </span>
                </span>
              </div>
              <span className="hidden sm:inline text-gray-300 dark:text-zinc-700">
                •
              </span>
              {currentUserId ? (
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="text-sm font-medium text-black dark:text-white underline underline-offset-4 decoration-gray-300 dark:decoration-zinc-700 hover:decoration-gold-base transition-all cursor-pointer"
                >
                  Write a Review
                </button>
              ) : (
                <span className="text-sm text-gray-400">
                  Log in to write a review
                </span>
              )}
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
                  ? (getPriceBySize(productItem.id, selectedSize) || 0).toFixed(
                      2
                    )
                  : (productItem.price || 0).toFixed(2)}
              </p>
            </div>
            {/* Sizes Selection */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <p className="font-bold uppercase text-xs tracking-widest dark:text-white">
                  Select Volume
                </p>
                <div className="flex gap-2">
                  {error && (
                    <span className="text-red-500 text-xs animate-bounce font-bold">
                      {error}
                    </span>
                  )}
                  {/* رسالة بتظهر لما يختار حجم خلصان */}
                  {isOutOfStock && (
                    <span className="text-red-500 text-xs font-bold animate-pulse">
                      OUT OF STOCK
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {productItem.size.map((s) => {
                  // بنشوف لو الحجم ده نفسه خلصان عشان نديله شكل مختلف
                  const variant = productItem.variants?.find(
                    (v) => v.volume === s
                  );
                  const isVariantOutOfStock = variant
                    ? Number(variant.stock) <= 0
                    : false;

                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedSize(s);
                        setError("");
                      }}
                      className={`min-w-[80px] py-3 px-4 rounded-xl border-2 transition-all duration-300 font-medium ${
                        selectedSize === s
                          ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black shadow-lg"
                          : isVariantOutOfStock
                          ? "border-gray-200 dark:border-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed opacity-60 line-through" // شكل الحجم اللي خلصان
                          : "border-gray-100 dark:border-zinc-800 hover:border-gold-base dark:text-zinc-400 cursor-pointer"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleAdd}
              disabled={added || isOutOfStock}
              className={`w-full py-5 rounded-2xl text-lg font-bold tracking-widest transition-all duration-500 shadow-2xl ${
                isOutOfStock
                  ? "bg-gray-300 dark:bg-zinc-800 text-gray-500 cursor-not-allowed shadow-none"
                  : added
                  ? "bg-gold-dark-20 text-white translate-y-[-2px] cursor-default"
                  : "bg-black dark:bg-gold-base text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-gold-light-20 cursor-pointer"
              }`}
            >
              {isOutOfStock
                ? "OUT OF STOCK"
                : added
                ? "ADDED TO COLLECTION ✓"
                : "ADD TO CART"}
            </button>
          </div>
        </div>

        <ProductReviews productId={productItem.id} />

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
                  image={p.images}
                  name={p.name}
                  price={p.variants?.[0]?.price || 0}
                  currency={currency}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {currentUserId && (
        <ReviewModal
          productId={productItem.id}
          userId={currentUserId}
          productName={productItem.name}
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
        />
      )}

      <Footer />
    </>
  );
};

export default Product;
