"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAdmin, PublicError, toPublicMessage } from "@/lib/auth-guards";
import { productCreateSchema, productUpdateSchema } from "@/lib/validations";
import { REVENUE_STATUSES } from "@/lib/revenue";

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
      error: toPublicMessage(error, "Failed to fetch products."),
    };
  }
}

export async function createProduct(input: unknown) {
  try {
    await requireAdmin();

    // Validate the untrusted admin payload: non-negative 2dp prices, integer
    // stock, unique variant volumes, UploadThing-hosted image URLs. `rating` is
    // deliberately NOT accepted — it is computed from approved reviews only.
    const parsed = productCreateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid product data.",
      };
    }
    const data = parsed.data;

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
        // rating omitted — server-computed from approved reviews (DB default 0).
        isFeatured: data.isFeatured,
        subcategory: data.subcategory,
        categoryId: data.categoryId ?? undefined,
        slug: generatedSlug,
        variants: {
          create: data.variants.map((v) => ({
            volume: v.volume,
            price: v.price,
            stock: v.stock,
          })),
        },
      },
    });

    revalidatePath("/admin/products");
    revalidatePath("/", "layout");
    return { success: true, data: newProduct };
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    return { success: false, error: toPublicMessage(error, "Something went wrong.") };
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
      error: toPublicMessage(error, "Failed to delete product."),
    };
  }
}

export async function getProductById(id: string) {
  try {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return { success: false, error: "Invalid Product ID." };
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

    if (!product) return { success: false, error: "Product not found." };

    return { success: true, data: serializeProduct(product) };
  } catch (error) {
    console.error("Get Product Error:", error);
    return { success: false, error: "A database error occurred." };
  }
}

export async function updateProduct(id: number, input: unknown) {
  try {
    await requireAdmin();
    if (isNaN(id)) throw new PublicError("Invalid Product ID.");

    // Same validation as create (prices, stock, unique volumes, image hosts).
    const parsed = productUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid product data.",
      };
    }
    const data = parsed.data;

    // undefined => leave category unchanged; null => disconnect; number => set.
    const parsedCategoryId = data.categoryId;

    const variantInputs = data.variants;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      // Update scalar product fields.
      const product = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          company: data.company,
          images: data.images,
          isFeatured: data.isFeatured ?? undefined,
          subcategory: data.subcategory ?? undefined,
          categoryId: parsedCategoryId,
        },
      });

      // Upsert variants by (productId, volume): keeps ids/stock for volumes
      // that still exist instead of dropping and recreating every row.
      for (const v of variantInputs) {
        await tx.productVariant.upsert({
          where: { productId_volume: { productId: id, volume: v.volume } },
          update: { price: v.price, stock: v.stock },
          create: {
            productId: id,
            volume: v.volume,
            price: v.price,
            stock: v.stock,
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
      error: toPublicMessage(error, "An unknown error occurred during the update."),
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
  // Clamp untrusted pagination: page >= 1, 1 <= limit <= 48, so a caller can't
  // request an unbounded page size.
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeLimit = Math.min(48, Math.max(1, Math.floor(Number(limit) || 12)));

  try {
    const skip = (safePage - 1) * safeLimit;
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        skip: skip,
        take: safeLimit,
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
      totalPages: Math.ceil(totalCount / safeLimit),
      currentPage: safePage,
    };
  } catch (error) {
    console.error("Error fetching all products:", error);
    return { products: [], totalCount: 0, totalPages: 0, currentPage: safePage };
  }
}

export async function searchProducts(query: string) {
  if (!query || query.trim() === "") return [];

  // Clamp the query to 100 chars so a huge string can't drive an expensive
  // scan (resource exhaustion).
  const q = query.trim().slice(0, 100);

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
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
    // Only count units/revenue from orders that were actually paid/fulfilled —
    // PENDING/AWAITING_PAYMENT and CANCELLED orders are excluded.
    const topSellersGrouping = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { status: { in: REVENUE_STATUSES } } },
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
      where: {
        productId: { in: productIds },
        order: { status: { in: REVENUE_STATUSES } },
      },
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
