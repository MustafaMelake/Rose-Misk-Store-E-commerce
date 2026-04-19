"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function getAdminProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: products };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

export async function createProduct(data: {
  name: string;
  description: string;
  company: string;
  images: string[];
  rating: number;
  isFeatured: boolean;
  categoryId?: number;
  subcategory?: string;
  slug: string;
  variants: { volume: string; price: number; stock: number }[];
}) {
  try {
    const generatedSlug =
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
        .replace(/^-+|-+$/g, "") +
      "-" +
      Date.now();
    const newProduct = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        company: data.company,
        images: data.images,
        rating: Number(data.rating),
        isFeatured: data.isFeatured,
        subcategory: data.subcategory,
        categoryId: data.categoryId ? Number(data.categoryId) : undefined,
        slug: generatedSlug,
        variants: {
          create: data.variants.map((v: any) => ({
            volume: v.volume,
            price: Number(v.price),
            stock: Number(v.stock),
          })),
        },
      },
    });

    revalidatePath("/admin/products");
    return { success: true, data: newProduct };
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    return { success: false, error: "حدث خطأ ما" };
  }
}

export async function deleteProduct(productId: number) {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "فشل في حذف المنتج" };
  }
}

export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { variants: true },
    });
    return { success: true, data: product };
  } catch (error) {
    return { success: false, error: "Product not found" };
  }
}

export async function updateProduct(id: number, data: any) {
  try {
    if (isNaN(id)) throw new Error("Invalid Product ID");

    const updatedProduct = await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });

      return await tx.product.update({
        where: { id: id },
        data: {
          name: data.name,
          description: data.description,
          company: data.company,
          images: data.images,
          rating: Number(data.rating) || 0,
          isFeatured: Boolean(data.isFeatured),
          subcategory: data.subcategory,
          categoryId: data.categoryId ? Number(data.categoryId) : undefined,
          variants: {
            create: data.variants.map((v: any) => ({
              volume: v.volume,
              price: Number(v.price),
              stock: Number(v.stock),
            })),
          },
        },
      });
    });

    revalidatePath("/admin/products");
    return { success: true, data: updatedProduct };
  } catch (error: any) {
    console.error("CRITICAL DATABASE ERROR:", error.message || error);
    return {
      success: false,
      error: "حدث خطأ أثناء الحفظ، راجع بيانات القسم (Category)",
    };
  }
}

export async function getBestSellers() {
  try {
    return await prisma.product.findMany({
      where: { isFeatured: true },
      include: {
        variants: true,
      },
      take: 5,
    });
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getLatestProducts() {
  try {
    return await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        variants: true,
      },
      take: 10,
    });
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return products;
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

export async function searchProducts(query: string) {
  if (!query || query.trim() === "") return [];

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 8,
      select: {
        id: true,
        name: true,
        images: true,
        company: true,
      },
    });
    return products;
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
}
