"use client";

import React, { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { ShopContext } from "../../../context/ShopContext";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import Title from "../../../components/Title";
import CheckOut from "../../../components/CheckOut";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/format";

interface CartDisplayItem {
  id: number;
  size: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
}

const Cart: React.FC = () => {
  const context = useContext(ShopContext);
  if (!context) return null;

  const { products, currency, cartItems, getPriceBySize, updateQuantity } =
    context;
  const [cartData, setCartData] = useState<CartDisplayItem[]>([]);

  useEffect(() => {
    const tempData: CartDisplayItem[] = [];

    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        const quantity = cartItems[productId][size];
        if (quantity > 0) {
          const product = products.find(
            (p) => String(p.id) === String(productId)
          );
          if (product) {
            tempData.push({
              id: Number(productId),
              size,
              quantity,
              name: product.name,
              price: getPriceBySize(productId, size),
              image:
                Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : "/placeholder.png",
            });
          }
        }
      }
    }
    setCartData(tempData);
  }, [cartItems, products, getPriceBySize]);

  // --- شاشة الكارت الفارغ ---
  if (cartData.length === 0) {
    return (
      <>
        <div className="py-32 flex flex-col items-center justify-center animate-fadeIn">
          <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-2xl prata-regular mb-2 dark:text-white">
            Your cart is empty
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 mb-8">
            Discover our exclusive fragrance collection.
          </p>
          <button
            onClick={() => (window.location.href = "/fragrances")}
            className="px-8 py-3 bg-black dark:bg-gold-base text-white dark:text-black uppercase text-xs tracking-[0.2em] font-bold hover:opacity-80 transition-all"
          >
            Start Shopping
          </button>
        </div>
        <Footer />
      </>
    );
  }

  // --- شاشة الكارت الحقيقية ---
  return (
    <>
      <div className="py-16 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Title text1="YOUR" text2="COLLECTION" />
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Product List */}
          <div className="flex-1 space-y-8">
            {cartData.map((item) => (
              <div
                key={`${item.id}-${item.size}`}
                className="group flex gap-6 pb-8 border-b border-gray-100 dark:border-zinc-800 last:border-0"
              >
                {/* Image Block */}
                <div className="relative w-24 h-32 sm:w-32 sm:h-40 overflow-hidden bg-gray-50 dark:bg-zinc-900 rounded-sm">
                  <Image
                    src={item.image}
                    alt={item.name}
                    priority
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                {/* Info Block */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium dark:text-white mb-1 uppercase tracking-tight">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gold-base font-bold tracking-widest uppercase mb-4">
                        {item.size}
                      </p>
                    </div>
                    <button
                      onClick={() => updateQuantity(item.id, item.size, 0)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex justify-between items-end">
                    {/* Quantity UI */}
                    <div className="flex items-center border border-gray-200 dark:border-zinc-800 rounded-full px-2 py-1">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.quantity - 1)
                        }
                        className="p-1 hover:text-gold-base transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.size, item.quantity + 1)
                        }
                        className="p-1 hover:text-gold-base transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <p className="text-lg font-bold dark:text-white">
                      <span className="text-xs font-normal mr-1">
                        {currency}
                      </span>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:w-[380px]">
            <div className="sticky top-32 bg-gray-50 dark:bg-zinc-950 p-8 rounded-sm border border-gray-100 dark:border-zinc-900">
              <CheckOut />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
