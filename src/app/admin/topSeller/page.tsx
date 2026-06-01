import React from "react";
import Image from "next/image";
import { TrendingUp, Star, Award, BarChart3, Banknote } from "lucide-react";
import {
  getTopSellingProducts,
  getTopRatedProducts,
} from "../../../../lib/actions/product.actions";

export const metadata = {
  title: "Top Sellers & Rated | Admin Dashboard",
};

export default async function TopSellersPage() {
  const topSellers = await getTopSellingProducts();
  const topRated = await getTopRatedProducts();

  return (
    <div className="flex-1 space-y-2 p-2 pt-1 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="prata-regular text-4xl text-black dark:text-white mb-2">
            Store Performance
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">
            Track your best-selling fragrances, top-rated products, and total
            revenue.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* 🏆 الأكثر مبيعاً (Top Sellers) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                <TrendingUp size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Top Selling Revenue
              </h2>
            </div>
            <span className="text-sm font-medium text-gray-500 bg-white dark:bg-zinc-800 py-1 px-3 rounded-full shadow-sm">
              All Time
            </span>
          </div>

          <div className="p-6 space-y-6">
            {topSellers.length > 0 ? (
              topSellers.map((product, index) => (
                <div key={product.id} className="flex items-center gap-5 group">
                  <div className="flex-shrink-0 w-8 text-center">
                    {index === 0 ? (
                      <Award className="mx-auto text-yellow-500" size={28} />
                    ) : (
                      <span className="text-xl font-bold text-gray-300 dark:text-zinc-700">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 shadow-inner group-hover:scale-105 transition-transform">
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={product.name!}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {product.company}
                    </p>
                  </div>

                  {/* 💰 عرض الفلوس وعدد القطع */}
                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="text-xl font-black">
                        {product.totalRevenue?.toLocaleString()}
                      </span>
                      <span className="text-sm font-bold">EGP</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
                      {product.totalSold} Units Sold
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No sales data available yet.
              </div>
            )}
          </div>
        </div>

        {/* ⭐ الأعلى تقييماً (Highest Rated) */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 text-amber-500 rounded-xl">
                <Star size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Highest Rated
              </h2>
            </div>
            <span className="text-sm font-medium text-gray-500 bg-white dark:bg-zinc-800 py-1 px-3 rounded-full shadow-sm">
              Approved Reviews
            </span>
          </div>

          <div className="p-6 space-y-6">
            {topRated.length > 0 ? (
              topRated.map((product, index) => (
                <div key={product.id} className="flex items-center gap-5 group">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="text-xl font-bold text-gray-300 dark:text-zinc-700">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 shadow-inner group-hover:scale-105 transition-transform">
                    <Image
                      src={product.images[0] || "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-zinc-400">
                      {product.company}
                    </p>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg">
                      <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                        {product.rating.toFixed(1)}
                      </span>
                      <Star
                        size={18}
                        className="fill-amber-500 text-amber-500"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 mt-1 uppercase">
                      {product.reviewsCount} Reviews
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">
                No rated products available yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
