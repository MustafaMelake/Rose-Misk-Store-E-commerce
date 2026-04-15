// src/app/admin/products/page.tsx
import Link from "next/link";
import Image from "next/image";
import { Plus, Edit, Star } from "lucide-react";
import { getAdminProducts } from "../../../../lib/actions/product.actions";
import DeleteProductButton from "../../../components/admin/DeleteProductButton";
export default async function AdminProductsPage() {
  const { success, data: products, error } = await getAdminProducts();

  if (!success) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Header - كما هو */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white prata-regular tracking-wide">
          Products Catalog
        </h1>
        <Link
          href="/admin/products/add"
          className="flex items-center gap-2 bg-gold-base hover:bg-yellow-600 text-white px-5 py-2.5 rounded-lg transition-all text-sm font-semibold shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Perfume
        </Link>
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
              {products?.map((product) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
