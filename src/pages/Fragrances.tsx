import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { ArrowRight } from "lucide-react";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

// 1. تعريف واجهة المنتج (Product Interface)
interface Product {
  id: number | string;
  name: string;
  price: number;
  image: string[] | string;
  category?: string;
  Subcategory?: string; // خلي بالك إن الـ S هنا كابيتال حسب كودك الأصلي
  season?: string;
}

const Fragrances: React.FC = () => {
  // سحب المنتجات من الـ Context مع حماية الـ Null
  const context = useContext(ShopContext);
  if (!context) return null;
  const { products } = context;

  // 2. تحديد أنواع الـ State
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [season, setSeason] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("relevant");

  // 3. تحديد نوع البرامتر (value: string)
  const toggleCategory = (value: string) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSubCategory = (value: string) => {
    setSubCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSeason = (value: string) => {
    setSeason((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  // دالة الفلترة والترتيب
  const applyFilter = () => {
    let result = products.slice();

    if (categories.length > 0) {
      result = result.filter(
        (p: Product) =>
          p.category && categories.includes(p.category.toLowerCase())
      );
    }

    if (subCategories.length > 0) {
      result = result.filter(
        (p: Product) =>
          p.Subcategory && subCategories.includes(p.Subcategory.toLowerCase())
      );
    }

    if (season.length > 0) {
      result = result.filter(
        (p: Product) => p.season && season.includes(p.season.toLowerCase())
      );
    }

    if (sortBy === "high-low") {
      result.sort((a: Product, b: Product) => b.price - a.price);
    } else if (sortBy === "low-high") {
      result.sort((a: Product, b: Product) => a.price - b.price);
    }

    setFilteredProducts(result);
  };

  // 4. دمجنا الـ useEffect لأن التحديث بيتم من خلال applyFilter
  useEffect(() => {
    applyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categories, subCategories, sortBy, season]);

  // 5. توحيد كلاسات الـ Checkbox عشان الكود يبقى نظيف ومقروء
  const checkboxClasses = `
    w-4 h-4 appearance-none border border-gray-400 rounded
    checked:bg-gold-base checked:border-gold-base
    relative cursor-pointer
    checked:after:content-['✔'] checked:after:text-white
    checked:after:text-[10px] checked:after:absolute
    checked:after:left-[2px] checked:after:top-[-1px]
  `;

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-12 pt-10 border-t dark:text-white px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      {/* FILTER SIDEBAR */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter((s) => !s)}
          className="my-2 text-xl cursor-pointer flex items-center gap-2"
        >
          <span>FILTERS</span>
          <ArrowRight
            size={16}
            className={`transition-transform sm:hidden ${
              showFilter ? "rotate-90" : ""
            }`}
          />
        </p>

        {/* CATEGORIES */}
        <div
          className={`border border-gray-200 dark:border-zinc-800 rounded-lg pl-5 py-3 mt-3 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 font-medium text-sm">CATEGORIES</p>
          <div className="flex flex-col gap-2 text-sm font-light">
            {["men", "women", "unsex"].map((cat) => (
              <label
                key={cat}
                className="flex gap-2 items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  className={checkboxClasses}
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* SUBCATEGORY */}
        <div
          className={`border border-gray-200 dark:border-zinc-800 rounded-lg pl-5 py-3 mt-3 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 font-medium text-sm">SUBCATEGORY</p>
          <div className="flex flex-col gap-2 text-sm font-light">
            {["niche", "designer"].map((sub) => (
              <label
                key={sub}
                className="flex gap-2 items-center cursor-pointer"
              >
                <input
                  type="checkbox"
                  className={checkboxClasses}
                  checked={subCategories.includes(sub)}
                  onChange={() => toggleSubCategory(sub)}
                />
                {sub.charAt(0).toUpperCase() + sub.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* SEASON */}
        <div
          className={`border border-gray-200 dark:border-zinc-800 rounded-lg pl-5 py-3 mt-3 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 font-medium text-sm">SEASON</p>
          <div className="flex flex-col gap-2 text-sm font-light">
            {["winter", "summer"].map((s) => (
              <label key={s} className="flex gap-2 items-center cursor-pointer">
                <input
                  type="checkbox"
                  className={checkboxClasses}
                  checked={season.includes(s)}
                  onChange={() => toggleSeason(s)}
                />
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: PRODUCTS LIST */}
      <div className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-base sm:text-2xl px-2 mb-6 gap-4">
          <Title text1="ALL" text2="FRAGRANCES" />

          <select
            className="border border-gray-300 dark:border-zinc-700 rounded px-3 py-1.5 text-sm dark:bg-zinc-900 dark:text-white outline-none focus:border-gold-base"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="high-low">Sort by: High to Low</option>
            <option value="low-high">Sort by: Low to High</option>
          </select>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filteredProducts.map((item) => (
            <ProductItem
              key={item.id}
              // تحويل الـ id لرقم صريح عشان يرضي ProductItem
              id={Number(item.id)}
              price={item.price}
              // التأكد إن الـ image دايماً مصفوفة (Array)
              image={Array.isArray(item.image) ? item.image : [item.image]}
              name={item.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fragrances;
