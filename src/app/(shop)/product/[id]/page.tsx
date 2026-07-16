import { notFound } from "next/navigation";
import { getProductById } from "../../../../../lib/actions/product.actions";
import ProductDetails, { ProductDetail } from "@/components/ProductDetails";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProductById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  // Server DTO -> client model. Variant prices are already numbers at runtime
  // (serialized from Prisma.Decimal inside getProductById).
  return <ProductDetails product={result.data as unknown as ProductDetail} />;
}
