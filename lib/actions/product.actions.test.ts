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
} from "./product.actions";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

// 1. Mock Prisma and Transaction
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
    },
  },
}));

// 2. Mock Next.js Cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

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
      slug: "", // Will be generated
      variants: [{ volume: "50ml", price: 100, stock: 10 }],
    };

    it("should create a product, generate a slug, and revalidate paths", async () => {
      const mockCreatedProduct = { id: 1, ...mockProductData };
      (prisma.product.create as any).mockResolvedValue(mockCreatedProduct);

      const result = await createProduct(mockProductData);

      expect(prisma.product.create).toHaveBeenCalled();

      // Verify slug generation logic is applied (creates a dashed slug)
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
      categoryId: 3,
      variants: [{ volume: "100ml", price: 150, stock: 5 }],
    };

    it("should delete old variants and update the product", async () => {
      (prisma.productVariant.deleteMany as any).mockResolvedValue({});
      (prisma.product.update as any).mockResolvedValue({
        id: 1,
        name: "Updated Perfume",
      });

      const result = await updateProduct(1, updateData);

      expect(prisma.productVariant.deleteMany).toHaveBeenCalledWith({
        where: { productId: 1 },
      });
      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            name: "Updated Perfume",
            categoryId: 3,
          }),
        })
      );
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

      // Requesting page 2 with limit 5
      const result = await getAllProducts(2, 5);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * 5
          take: 5,
        })
      );
      expect(result.totalCount).toBe(20);
      expect(result.totalPages).toBe(4); // 20 / 5
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
});
