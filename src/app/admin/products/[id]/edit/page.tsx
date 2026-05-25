import { notFound } from "next/navigation";
import { getProductById } from "../../../../../../lib/actions/product.actions";
import EditProductForm from "../../../../../components/admin/EditProductForm";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const result = await getProductById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const productData = result.data;
  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold dark:text-white">Edit Product</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          Update your product information, pricing, and stock levels.
        </p>
      </div>

      <EditProductForm initialData={productData} />
    </div>
  );
}
