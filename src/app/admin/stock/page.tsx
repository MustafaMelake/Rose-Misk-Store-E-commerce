import React from "react";
import Image from "next/image";
import { PackageOpen, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { getInventoryProducts } from "../../../../lib/actions/product.actions";

export const metadata = {
  title: "Inventory & Stock | Admin Dashboard",
};

export default async function StockPage() {
  const inventoryVariants = await getInventoryProducts();

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return {
        label: "Out of Stock",
        color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
        icon: XCircle,
      };
    }
    if (stock <= 5) {
      return {
        label: "Low Stock",
        color:
          "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
        icon: AlertCircle,
      };
    }
    return {
      label: "In Stock",
      color:
        "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
      icon: CheckCircle2,
    };
  };

  return (
    <div className="flex-1 space-y-2 p-2 pt-1 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-zinc-800 pb-6">
        <div>
          <h1 className="prata-regular text-4xl text-black dark:text-white mb-2">
            Inventory Management
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 mt-1">
            Monitor stock levels across all fragrance volumes and variants.
          </p>
        </div>
      </div>

      {/* Inventory List/Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {/* Table Header (Desktop only) */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-6 bg-gray-50/50 dark:bg-zinc-900/50 border-b border-gray-100 dark:border-zinc-800 text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
          <div className="col-span-5">Product Details</div>
          <div className="col-span-2 text-center">Volume</div>
          <div className="col-span-2 text-center">Price</div>
          <div className="col-span-3 text-right">Stock Status</div>
        </div>

        {/* Product Variant Rows */}
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {inventoryVariants.length > 0 ? (
            inventoryVariants.map((variant) => {
              const status = getStockStatus(variant.stock);
              const StatusIcon = status.icon;
              const product = variant.product;

              return (
                <div
                  key={variant.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {/* Product Info */}
                  <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 flex-shrink-0 border border-gray-200 dark:border-zinc-700">
                      <Image
                        src={product.images?.[0] || "/placeholder.png"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-zinc-400">
                        {product.company}
                      </p>
                    </div>
                  </div>

                  {/* Volume/Size */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                    <span className="md:hidden text-sm text-gray-500">
                      Volume:
                    </span>
                    <span className="font-medium text-gray-700 dark:text-zinc-300 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">
                      {variant.volume}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="col-span-1 md:col-span-2 flex justify-between md:justify-center items-center">
                    <span className="md:hidden text-sm text-gray-500">
                      Price:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {Number(variant.price)} EGP
                    </span>
                  </div>

                  {/* Stock Status */}
                  <div className="col-span-1 md:col-span-3 flex justify-between md:justify-end items-center gap-3 mt-4 md:mt-0">
                    <div className="flex flex-col items-end">
                      <span className="text-2xl font-black text-gray-900 dark:text-white">
                        {variant.stock}
                      </span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">
                        Pieces Left
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold ${status.color}`}
                    >
                      <StatusIcon size={16} />
                      {status.label}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 text-gray-500">
              No inventory data found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
