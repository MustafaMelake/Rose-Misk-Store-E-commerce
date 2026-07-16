// src/app/admin/products/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminProducts } from "../../../../lib/actions/product.actions";
import ProductsTable from "../../../components/admin/ProductsTable";

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

      <ProductsTable products={products ?? []} />
    </div>
  );
}
