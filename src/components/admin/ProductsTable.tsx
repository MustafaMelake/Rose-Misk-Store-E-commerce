"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Star, Search } from "lucide-react";
import DeleteProductButton from "./DeleteProductButton";

export default function ProductsTable({ products }: { products: any[] }) {
  const [query, setQuery] = useState("");

  const filteredProducts = products.filter((product) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return (
      product.name?.toLowerCase().includes(term) ||
      product.company?.toLowerCase().includes(term) ||
      product.category?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, brand, or category..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 dark:text-white outline-none focus:ring-2 focus:ring-gold-base"
        />
      </div>

      <div className="bg-white dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-center">
                  Stock
                </th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-zinc-400"
                  >
                    No products match your search.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {/* Product Image Preview */}
                        <div className="relative w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 border dark:border-zinc-700 overflow-hidden">
                          <Image
                            src={product.images[0] || "/placeholder-perfume.jpg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            {product.name}
                            {product.isFeatured && (
                              <Star className="w-3.5 h-3.5 fill-gold-base text-gold-base" />
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 font-medium uppercase tracking-tight">
                            {product.company} •{" "}
                            {product.category?.name || "No Category"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          product.isFeatured
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                        }`}
                      >
                        {product.isFeatured ? "Featured" : "Standard"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                        {product.variants.length} Variants
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-4 items-center">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="text-zinc-400 hover:text-gold-base transition-all p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <DeleteProductButton id={product.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
