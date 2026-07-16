"use server";

import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, PublicError, toPublicMessage } from "@/lib/auth-guards";
import type { ProductUpdateInput } from "../validations";

/**
 * Serialize a product's variant prices from Prisma.Decimal to plain numbers
 * so client components can do arithmetic on them. Only touches products that
 * actually have variants loaded. Runtime returns numbers; the static type is
 * preserved for callers (the ShopContext boundary casts to its own model).
 */
function serializeProduct<T extends { variants?: any[] }>(product: T): T {
  if (!product?.variants) return product;
  return {
    ...product,
    variants: product.variants.map((v) => ({ ...v, price: Number(v.price) })),
  } as T;
}

export async function getAdminProducts() {
  try {
    await requireAdmin();
    const products = await prisma.product.findMany({
      include: {
        category: true,
        variants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, data: products.map(serializeProduct) };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      error: toPublicMessage(error, "Failed to fetch products"),
    };
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
    await requireAdmin();
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
        rating: Number(data.rating) || 5,
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
    revalidatePath("/", "layout");
    return { success: true, data: newProduct };
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    return { success: false, error: toPublicMessage(error, "حدث خطأ ما") };
  }
}

export async function deleteProduct(productId: number) {
  try {
    await requireAdmin();
    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/admin/products");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return {
      success: false,
      error: toPublicMessage(error, "فشل في حذف المنتج"),
    };
  }
}

export async function getProductById(id: string) {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return { success: false, error: "Invalid Product ID" };
    }

    const product = await prisma.product.findUnique({
      where: { id: parsedId },
      include: {
        variants: true,
        reviews: {
          where: {
            status: "APPROVED",
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: { name: true, image: true },
            },
          },
        },
      },
    });

    if (!product) return { success: false, error: "Product not found" };

    return { success: true, data: serializeProduct(product) };
  } catch (error) {
    console.error("Get Product Error:", error);
    return { success: false, error: "Database error occurred" };
  }
}

export async function updateProduct(id: number, data: ProductUpdateInput) {
  try {
    await requireAdmin();
    if (isNaN(id)) throw new PublicError("Invalid Product ID");

    let parsedCategoryId: number | null | undefined = undefined;

    if (data.categoryId) {
      const num = Number(data.categoryId);
      if (isNaN(num)) {
        throw new PublicError("Invalid Category ID format");
      }
      parsedCategoryId = num;
    } else if (data.categoryId === null || data.categoryId === "") {
      parsedCategoryId = null;
    }

    const variantInputs = data.variants ?? [];

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update scalar product fields.
      const product = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          company: data.company,
          images: data.images,
          isFeatured: Boolean(data.isFeatured),
          subcategory: data.subcategory ?? undefined,
          categoryId: parsedCategoryId,
        },
      });

      // Upsert variants by (productId, volume): keeps ids/stock for volumes
      // that still exist instead of dropping and recreating every row.
      for (const v of variantInputs) {
        await tx.productVariant.upsert({
          where: { productId_volume: { productId: id, volume: v.volume } },
          update: { price: Number(v.price), stock: Number(v.stock) },
          create: {
            productId: id,
            volume: v.volume,
            price: Number(v.price),
            stock: Number(v.stock),
          },
        });
      }

      // Remove any variants whose volume is no longer in the payload.
      await tx.productVariant.deleteMany({
        where: {
          productId: id,
          volume: { notIn: variantInputs.map((v) => v.volume) },
        },
      });

      return product;
    });

    revalidatePath("/admin/products");
    revalidatePath("/", "layout");
    return { success: true, data: updatedProduct };
  } catch (error: any) {
    console.error("CRITICAL DATABASE ERROR:", error?.message || error);
    return {
      success: false,
      error: toPublicMessage(error, "حدث خطأ غير معروف أثناء التحديث."),
    };
  }
}

export async function getBestSellers() {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: {
        variants: true,
      },
      take: 5,
    });
    return products.map(serializeProduct);
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getLatestProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        variants: true,
      },
      take: 10,
    });
    return products.map(serializeProduct);
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

export async function getAllProducts(page: number = 1, limit: number = 12) {
  try {
    const skip = (page - 1) * limit;
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        skip: skip,
        take: limit,
        include: {
          variants: true,
          category: {
            select: { id: true, name: true },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.product.count(),
    ]);

    return {
      products: products.map(serializeProduct),
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error("Error fetching all products:", error);
    return { products: [], totalCount: 0, totalPages: 0, currentPage: page };
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

export async function getTopSellingProducts() {
  try {
    await requireAdmin();
    const topSellersGrouping = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const productIds = topSellersGrouping.map((item) => item.productId);

    // No sales yet — skip the follow-up lookups entirely.
    if (productIds.length === 0) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        images: true,
        company: true,
      },
    });

    const orderItemsForRevenue = await prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, quantity: true, price: true },
    });

    const result = topSellersGrouping.map((item) => {
      const product = products.find((p) => p.id === item.productId);

      const productOrders = orderItemsForRevenue.filter(
        (oi) => oi.productId === item.productId
      );
      const totalRevenue = productOrders.reduce(
        (sum, current) => sum + current.quantity * Number(current.price),
        0
      );

      return {
        id: product?.id,
        name: product?.name,
        image: product?.images[0],
        company: product?.company,
        totalSold: item._sum.quantity || 0,
        totalRevenue: totalRevenue,
      };
    });

    return result.sort((a, b) => b.totalSold - a.totalSold);
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return [];
  }
}

export async function getTopRatedProducts() {
  try {
    await requireAdmin();
    const topRated = await prisma.product.findMany({
      where: {
        reviewsCount: { gt: 0 },
      },
      orderBy: [{ rating: "desc" }, { reviewsCount: "desc" }],
      take: 5,
      select: {
        id: true,
        name: true,
        images: true,
        company: true,
        rating: true,
        reviewsCount: true,
      },
    });

    return topRated;
  } catch (error) {
    console.error("Error fetching top rated products:", error);
    return [];
  }
}

export async function getInventoryProducts() {
  try {
    await requireAdmin();
    const products = await prisma.productVariant.findMany({
      include: {
        product: {
          select: {
            name: true,
            images: true,
            company: true,
          },
        },
      },
      orderBy: {
        stock: "asc",
      },
    });

    return products;
  } catch (error) {
    console.error("Error fetching inventory products:", error);
    return [];
  }
}
