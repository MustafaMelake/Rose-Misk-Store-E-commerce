"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"; // ضفت أيقونات للـ Pagination
import Title from "../../components/Title";
import ProductItem from "../../components/ProductItem";
import { getCategories } from "../../../lib/actions/category.actions";

const Fragrances: React.FC = () => {
  const context = useContext(ShopContext);
  if (!context) return null;
  const { products, currency } = context;

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("relevant");

  // --- States الخاصة بالـ Pagination ---
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchCats = async () => {
      const res = await getCategories();
      if (res.success && res.data) {
        setDbCategories(res.data);
      }
    };
    fetchCats();
  }, []);

  // إرجاع الصفحة لرقم 1 عند تغيير أي فلتر أو ترتيب
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, subCategories, sortBy]);

  const toggleCategory = (value: string) => {
    setSelectedCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSubCategory = (value: string) => {
    setSubCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const filteredProducts = useMemo(() => {
    let result = products.slice();

    if (selectedCategories.length > 0) {
      result = result.filter(
        (p: any) =>
          p.category &&
          selectedCategories.includes(p.category.name.toLowerCase())
      );
    }

    if (subCategories.length > 0) {
      result = result.filter(
        (p: any) =>
          p.subcategory && subCategories.includes(p.subcategory.toLowerCase())
      );
    }

    if (sortBy === "high-low") {
      result.sort(
        (a: any, b: any) =>
          (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0)
      );
    } else if (sortBy === "low-high") {
      result.sort(
        (a: any, b: any) =>
          (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0)
      );
    }

    return result;
  }, [products, selectedCategories, subCategories, sortBy]);

  // --- حسابات الـ Pagination ---
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // المنتجات اللي هتتعرض في الصفحة الحالية بس
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const checkboxClasses = `
    w-4 h-4 appearance-none border border-gray-400 rounded
    checked:bg-gold-base checked:border-gold-base
    relative cursor-pointer
    checked:after:content-['✔'] checked:after:text-white
    checked:after:text-[10px] checked:after:absolute
    checked:after:left-[2px] checked:after:top-[-1px]
  `;

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-12 pt-10 border-t dark:text-white px-4 sm:px-[5vw] md:px-[3vw] lg:px-[4vw]">
      {/* FILTER SIDEBAR */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter((s) => !s)}
          className="my-2 text-xl cursor-pointer flex items-center gap-2 font-medium"
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
          className={`border border-gray-200 dark:border-zinc-800 rounded-lg pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 font-medium text-sm text-gold-base uppercase tracking-widest">
            Categories
          </p>
          <div className="flex flex-col gap-2 text-sm font-light">
            {dbCategories.map((cat) => (
              <label
                key={cat.id}
                className="flex gap-2 items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className={checkboxClasses}
                  checked={selectedCategories.includes(cat.name.toLowerCase())}
                  onChange={() => toggleCategory(cat.name.toLowerCase())}
                />
                <span className="group-hover:text-gold-base transition-colors">
                  {cat.name}
                </span>
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
          <p className="mb-3 font-medium text-sm text-gold-base uppercase tracking-widest">
            Type
          </p>
          <div className="flex flex-col gap-2 text-sm font-light">
            {["niche", "designer"].map((sub) => (
              <label
                key={sub}
                className="flex gap-2 items-center cursor-pointer group"
              >
                <input
                  type="checkbox"
                  className={checkboxClasses}
                  checked={subCategories.includes(sub)}
                  onChange={() => toggleSubCategory(sub)}
                />
                <span className="group-hover:text-gold-base transition-colors">
                  {sub.charAt(0).toUpperCase() + sub.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: PRODUCTS LIST */}
      <div className="flex-1 pb-16">
        {" "}
        {/* ضفت padding تحت عشان الـ Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-base sm:text-2xl mb-6 gap-4">
          <Title text1="ALL" text2="FRAGRANCES" />

          <select
            className="border border-gray-300 dark:border-zinc-700 rounded px-3 py-1.5 text-sm dark:bg-zinc-900 dark:text-white outline-none focus:border-gold-base"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Price (Low to High)</option>
            <option value="high-low">Sort by: Price (High to Low)</option>
          </select>
        </div>
        {/* PRODUCTS GRID - بنعرض currentProducts بدل filteredProducts */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {currentProducts.map((item: any) => (
            <ProductItem
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.images}
              price={item.variants?.[0]?.price || 0}
              currency={currency}
            />
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            No fragrances found matching these filters.
          </div>
        )}
        {/* --- PAGINATION CONTROLS --- */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-300 dark:border-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-10 h-10 flex items-center justify-center border rounded transition-colors text-sm font-medium
                  ${
                    currentPage === index + 1
                      ? "bg-gold-base text-white border-gold-base"
                      : "border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  }
                `}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-300 dark:border-zinc-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Fragrances;
