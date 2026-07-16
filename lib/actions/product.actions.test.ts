import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAdminProducts,
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
  getBestSellers,
  getLatestProducts,
  getAllProducts,
  searchProducts,
  getTopRatedProducts,
  getInventoryProducts,
  getTopSellingProducts,
} from "./product.actions";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

// 1. ✨ Mock Prisma
vi.mock("../prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) => {
      return await callback(prisma);
    }),
    product: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    productVariant: {
      deleteMany: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// 2. Mock Next.js Cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// 3. Mock the auth guards — mutations and admin reads require an admin.
vi.mock("@/lib/auth-guards", () => {
  class PublicError extends Error {}
  class AuthError extends PublicError {}
  return {
    PublicError,
    AuthError,
    getCurrentUser: vi.fn(async () => ({ id: "user_123", role: "USER" })),
    requireUser: vi.fn(async () => ({ id: "user_123", role: "USER" })),
    requireAdmin: vi.fn(async () => ({ id: "admin_1", role: "ADMIN" })),
    toPublicMessage: (e: any, fb = "An unexpected error occurred.") =>
      e instanceof PublicError ? e.message : fb,
  };
});

describe("Product Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAdminProducts", () => {
    it("should fetch and return all products", async () => {
      const mockProducts = [{ id: 1, name: "Perfume A" }];
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const result = await getAdminProducts();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        include: { category: true, variants: true },
        orderBy: { createdAt: "desc" },
      });
      expect(result).toEqual({ success: true, data: mockProducts });
    });

    it("should return error on database failure", async () => {
      (prisma.product.findMany as any).mockRejectedValue(new Error("DB Error"));

      const result = await getAdminProducts();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch products");
    });
  });

  describe("createProduct", () => {
    const mockProductData = {
      name: "Luxury Perfume",
      description: "A great scent",
      company: "BrandX",
      images: ["img1.jpg"],
      rating: 5,
      isFeatured: true,
      categoryId: 2,
      slug: "",
      variants: [{ volume: "50ml", price: 100, stock: 10 }],
    };

    it("should create a product, generate a slug, and revalidate paths", async () => {
      const mockCreatedProduct = { id: 1, ...mockProductData };
      (prisma.product.create as any).mockResolvedValue(mockCreatedProduct);

      const result = await createProduct(mockProductData);

      expect(prisma.product.create).toHaveBeenCalled();

      const callArgs = (prisma.product.create as any).mock.calls[0][0];
      expect(callArgs.data.slug).toContain("luxury-perfume");
      expect(callArgs.data.variants.create[0]).toEqual({
        volume: "50ml",
        price: 100,
        stock: 10,
      });

      expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
      expect(revalidatePath).toHaveBeenCalledWith("/", "layout");
      expect(result.success).toBe(true);
    });
  });

  describe("deleteProduct", () => {
    it("should delete a product by ID and revalidate paths", async () => {
      (prisma.product.delete as any).mockResolvedValue({ id: 1 });

      const result = await deleteProduct(1);

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
      expect(result.success).toBe(true);
    });
  });

  describe("getProductById", () => {
    it("should return a product if ID is valid", async () => {
      const mockProduct = { id: 1, name: "Perfume" };
      (prisma.product.findUnique as any).mockResolvedValue(mockProduct);

      const result = await getProductById("1");

      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } })
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProduct);
    });

    it("should return an error for invalid ID format", async () => {
      const result = await getProductById("abc");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid Product ID");
      expect(prisma.product.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("updateProduct", () => {
    const updateData = {
      name: "Updated Perfume",
      images: [],
      categoryId: 3,
      variants: [{ volume: "100ml", price: 150, stock: 5 }],
    };

    it("should upsert variants and update the product's scalar fields", async () => {
      (prisma.productVariant.upsert as any).mockResolvedValue({});
      (prisma.productVariant.deleteMany as any).mockResolvedValue({});
      (prisma.product.update as any).mockResolvedValue({
        id: 1,
        name: "Updated Perfume",
      });

      const result = await updateProduct(1, updateData);

      // Scalar fields updated (no variants nested-create anymore)
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            name: "Updated Perfume",
            categoryId: 3,
          }),
        })
      );

      // Each incoming variant is upserted by (productId, volume)
      expect(prisma.productVariant.upsert).toHaveBeenCalledWith({
        where: { productId_volume: { productId: 1, volume: "100ml" } },
        update: { price: 150, stock: 5 },
        create: { productId: 1, volume: "100ml", price: 150, stock: 5 },
      });

      // Variants no longer present are removed
      expect(prisma.productVariant.deleteMany).toHaveBeenCalledWith({
        where: { productId: 1, volume: { notIn: ["100ml"] } },
      });

      expect(revalidatePath).toHaveBeenCalledWith("/admin/products");
      expect(result.success).toBe(true);
    });

    it("should throw an error if the product ID is NaN", async () => {
      const result = await updateProduct(NaN, updateData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid Product ID");
    });
  });

  describe("getAllProducts", () => {
    it("should implement pagination correctly", async () => {
      const mockProducts = [{ id: 1 }, { id: 2 }];
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.product.count as any).mockResolvedValue(20);

      const result = await getAllProducts(2, 5);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
      expect(result.totalCount).toBe(20);
      expect(result.totalPages).toBe(4);
      expect(result.currentPage).toBe(2);
    });
  });

  describe("searchProducts", () => {
    it("should return empty array if query is empty", async () => {
      const result = await searchProducts("   ");
      expect(result).toEqual([]);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it("should search by name or description", async () => {
      const mockResults = [{ id: 1, name: "Oud" }];
      (prisma.product.findMany as any).mockResolvedValue(mockResults);

      const result = await searchProducts("Oud");

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: "Oud", mode: "insensitive" } },
              { description: { contains: "Oud", mode: "insensitive" } },
            ],
          },
          take: 8,
        })
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe("getBestSellers", () => {
    it("should fetch up to 5 featured products", async () => {
      const mockProducts = [
        { id: 1, name: "Best Fragrance", isFeatured: true },
      ];
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const result = await getBestSellers();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { isFeatured: true },
        include: { variants: true },
        take: 5,
      });
      expect(result).toEqual(mockProducts);
    });

    it("should return empty array on database failure", async () => {
      (prisma.product.findMany as any).mockRejectedValue(
        new Error("Database Error")
      );
      const result = await getBestSellers();
      expect(result).toEqual([]);
    });
  });

  describe("getLatestProducts", () => {
    it("should fetch up to 10 latest products ordered by createdAt desc", async () => {
      const mockProducts = [{ id: 1, name: "New Arrival" }];
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);

      const result = await getLatestProducts();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: "desc" },
        include: { variants: true },
        take: 10,
      });
      expect(result).toEqual(mockProducts);
    });

    it("should return empty array on database failure", async () => {
      (prisma.product.findMany as any).mockRejectedValue(
        new Error("Database Error")
      );
      const result = await getLatestProducts();
      expect(result).toEqual([]);
    });
  });

  describe("getTopRatedProducts", () => {
    it("should fetch up to 5 top rated products with custom selection fields", async () => {
      const mockTopRated = [{ id: 1, name: "Highly Rated Oud", rating: 4.9 }];
      (prisma.product.findMany as any).mockResolvedValue(mockTopRated);

      const result = await getTopRatedProducts();

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { reviewsCount: { gt: 0 } },
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
      expect(result).toEqual(mockTopRated);
    });

    it("should return empty array on database failure", async () => {
      (prisma.product.findMany as any).mockRejectedValue(
        new Error("Database Error")
      );
      const result = await getTopRatedProducts();
      expect(result).toEqual([]);
    });
  });

  describe("getInventoryProducts", () => {
    it("should fetch all variants ordered by stock level ascending", async () => {
      const mockVariants = [
        { id: 1, volume: "100ml", stock: 2, product: { name: "Misk" } },
      ];
      (prisma.productVariant.findMany as any).mockResolvedValue(mockVariants);

      const result = await getInventoryProducts();

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        include: {
          product: {
            select: { name: true, images: true, company: true },
          },
        },
        orderBy: { stock: "asc" },
      });
      expect(result).toEqual(mockVariants);
    });

    it("should return empty array on database failure", async () => {
      (prisma.productVariant.findMany as any).mockRejectedValue(
        new Error("Database Error")
      );
      const result = await getInventoryProducts();
      expect(result).toEqual([]);
    });
  });

  describe("getTopSellingProducts", () => {
    it("should aggregate order items, find associated products, and compute calculated total revenue correctly", async () => {
      const mockGrouping = [{ productId: 123, _sum: { quantity: 5 } }];
      const mockProducts = [
        {
          id: 123,
          name: "Rose Oud",
          images: ["rose.jpg"],
          company: "Rose Misk",
        },
      ];
      const mockOrderItemsForRevenue = [
        { productId: 123, quantity: 5, price: 1000 },
      ];

      (prisma.orderItem.groupBy as any).mockResolvedValue(mockGrouping);
      (prisma.product.findMany as any).mockResolvedValue(mockProducts);
      (prisma.orderItem.findMany as any).mockResolvedValue(
        mockOrderItemsForRevenue
      );

      const result = await getTopSellingProducts();

      expect(prisma.orderItem.groupBy).toHaveBeenCalledWith({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      });

      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: [123] } },
        select: { id: true, name: true, images: true, company: true },
      });

      expect(result).toEqual([
        {
          id: 123,
          name: "Rose Oud",
          image: "rose.jpg",
          company: "Rose Misk",
          totalSold: 5,
          totalRevenue: 5000,
        },
      ]);
    });

    it("should return empty array on failure inside the calculation blocks", async () => {
      (prisma.orderItem.groupBy as any).mockRejectedValue(
        new Error("Aggregation Error")
      );
      const result = await getTopSellingProducts();
      expect(result).toEqual([]);
    });
  });
});
