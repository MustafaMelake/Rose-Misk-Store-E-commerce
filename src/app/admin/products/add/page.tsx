"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { createProduct } from "../../../../../lib/actions/product.actions";
import { getCategories } from "../../../../../lib/actions/category.actions";
// تم تعديل الاستيراد هنا ليكون UploadButton
import { UploadButton } from "../../../../../lib/uploadthing";

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );

  // الداتا الأساسية للمنتج (تم إضافة categoryId و subcategory)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    company: "Rose Misk",
    rating: 5,
    isFeatured: false,
    categoryId: "",
    subcategory: "designer",
  });

  // State الصور (هنعتمد على دي بس للروابط اليدوية أو المرفوعة)
  const [images, setImages] = useState<string[]>([""]);

  useEffect(() => {
    async function fetchCategories() {
      const res = await getCategories();
      if (res.success && res.data) {
        setCategories(res.data);
      }
    }
    fetchCategories();
  }, []);

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const [variants, setVariants] = useState([
    { volume: "50ml", price: 0, stock: 10 },
  ]);

  const handleAddVariant = () => {
    setVariants([...variants, { volume: "", price: 0, stock: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const handleVariantChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newVariants = [...variants] as any;
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createProduct({
      ...formData,
      slug: formData.name.toLowerCase().replace(/ /g, "-") + "-" + Date.now(), // توليد slug بسيط
      categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
      variants,
      images: images.filter((img) => img !== ""),
    });

    if (result.success) {
      router.push("/admin/products");
    } else {
      setError(result.error || "فشل في إضافة المنتج");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 bg-white dark:bg-zinc-900 rounded-md border dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </Link>
        <h1 className="text-2xl font-bold dark:text-white">Add New Product</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Card */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border dark:border-zinc-800 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold dark:text-white border-b dark:border-zinc-800 pb-2">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium dark:text-zinc-300">
                Product Name
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-2 border dark:border-zinc-800 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-gold-base outline-none"
                placeholder="e.g. Kilian Angels' Share"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">
                Brand / Company
              </label>
              <input
                required
                type="text"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full p-2 border dark:border-zinc-800 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-gold-base outline-none"
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">
                Category
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="w-full p-2 border dark:border-zinc-800 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-gold-base outline-none appearance-none"
              >
                <option value="" disabled className="dark:bg-zinc-900">
                  Select Category
                </option>

                {categories.map((cat) => (
                  <option
                    key={cat.id}
                    value={cat.id}
                    className="dark:bg-zinc-900"
                  >
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Input/Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">
                Subcategory
              </label>
              <select
                value={formData.subcategory}
                onChange={(e) =>
                  setFormData({ ...formData, subcategory: e.target.value })
                }
                className="w-full p-2 border dark:border-zinc-800 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-gold-base outline-none appearance-none"
              >
                <option value="designer" className="dark:bg-zinc-900">
                  Designer
                </option>
                <option value="niche" className="dark:bg-zinc-900">
                  Niche
                </option>
                <option value="oriental" className="dark:bg-zinc-900">
                  Oriental
                </option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium dark:text-zinc-300">
                Description
              </label>
              <textarea
                required
                rows={4}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full p-2 border dark:border-zinc-800 rounded-md bg-transparent dark:text-white focus:ring-2 focus:ring-gold-base outline-none resize-none"
                placeholder="An exotic twist on the original classic..."
              />
            </div>
          </div>
        </div>

        {/* Media & Settings Section */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border dark:border-zinc-800 shadow-sm space-y-6">
          <h2 className="text-lg font-semibold dark:text-white border-b dark:border-zinc-800 pb-2">
            Media & Settings
          </h2>

          <div className="space-y-4">
            <label className="text-sm font-medium dark:text-zinc-300">
              Product Images
            </label>

            {/* عرض الحقول اليدوية (لو حابب تحط رابط مباشر) */}
            {images.map((url, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleImageChange(index, e.target.value)}
                  placeholder="https://... أو مسار الصورة"
                  className="flex-1 p-2 border dark:border-zinc-800 rounded-md bg-transparent dark:text-white outline-none focus:ring-1 focus:ring-gold-base"
                />
                <button
                  type="button"
                  onClick={() => {
                    const newImages = [...images];
                    // السماح بمسح الحقل فقط إذا كان هناك حقول أخرى أو إذا كان مليئاً
                    if (images.length > 1) {
                      newImages.splice(index, 1);
                      setImages(newImages);
                    } else {
                      newImages[index] = "";
                      setImages(newImages);
                    }
                  }}
                  className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setImages([...images, ""])}
              className="text-sm text-gold-base flex items-center gap-1 font-medium"
            >
              <Plus className="w-4 h-4" /> إضافة رابط صورة يدوياً
            </button>

            <div className="my-4 border-t border-b dark:border-zinc-800 py-4">
              <p className="text-sm text-zinc-500 mb-3 text-center">
                أو قم برفع الصور مباشرة
              </p>

              {/* زر الرفع من UploadThing */}
              <UploadButton
                endpoint="productImage"
                onClientUploadComplete={(res) => {
                  const uploadedUrls = res.map((img) => img.url);
                  // إضافة الروابط المرفوعة للمصفوفة وإزالة أي حقول فارغة
                  setImages((prev) => {
                    const filtered = prev.filter((img) => img !== "");
                    return [...filtered, ...uploadedUrls];
                  });
                  alert("تم رفع الصور بنجاح!");
                }}
                onUploadError={(error: Error) => {
                  alert(`حدث خطأ أثناء الرفع: ${error.message}`);
                }}
              />
            </div>

            {/* معاينة الصور المرفوعة */}
            {images.some((img) => img !== "") && (
              <div className="flex gap-2 flex-wrap">
                {images
                  .filter((img) => img !== "")
                  .map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="معاينة"
                      className="w-20 h-20 object-cover rounded-md border dark:border-zinc-800"
                    />
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t dark:border-zinc-800">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-zinc-300">
                Initial Rating (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rating: parseFloat(e.target.value),
                  })
                }
                className="w-full p-2 border dark:border-zinc-800 rounded-md bg-transparent dark:text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
                className="w-5 h-5 accent-gold-base cursor-pointer"
              />
              <label
                htmlFor="isFeatured"
                className="text-sm font-medium dark:text-zinc-300 cursor-pointer"
              >
                Mark as Best Seller (Featured)
              </label>
            </div>
          </div>
        </div>

        {/* Variants Card (Volumes & Prices) */}
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg border dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b dark:border-zinc-800 pb-2">
            <h2 className="text-lg font-semibold dark:text-white">
              Sizes & Pricing (Variants)
            </h2>
            <button
              type="button"
              onClick={handleAddVariant}
              className="text-sm flex items-center gap-1 text-gold-base hover:text-yellow-600 font-medium"
            >
              <Plus className="w-4 h-4" /> Add Size
            </button>
          </div>

          {variants.map((variant, index) => (
            <div
              key={index}
              className="flex items-end gap-4 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-md border dark:border-zinc-800"
            >
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium dark:text-zinc-400">
                  Volume (e.g. 50ml)
                </label>
                <input
                  required
                  type="text"
                  value={variant.volume}
                  onChange={(e) =>
                    handleVariantChange(index, "volume", e.target.value)
                  }
                  className="w-full p-2 text-sm border dark:border-zinc-800 rounded-md bg-white dark:bg-black dark:text-white outline-none"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium dark:text-zinc-400">
                  Price ($)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) =>
                    handleVariantChange(index, "price", e.target.value)
                  }
                  className="w-full p-2 text-sm border dark:border-zinc-800 rounded-md bg-white dark:bg-black dark:text-white outline-none"
                />
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-xs font-medium dark:text-zinc-400">
                  Stock
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(e) =>
                    handleVariantChange(index, "stock", e.target.value)
                  }
                  className="w-full p-2 text-sm border dark:border-zinc-800 rounded-md bg-white dark:bg-black dark:text-white outline-none"
                />
              </div>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(index)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors mb-[2px]"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-gold-base hover:bg-yellow-600 text-white px-8 py-3 rounded-md transition-colors font-medium disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Save Product"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
