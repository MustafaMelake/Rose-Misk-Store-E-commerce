"use client";

import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../../../context/ShopContext";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import Title from "../../../components/Title";
import ProductItem from "../../../components/ProductItem";
import { getCategories } from "../../../../lib/actions/category.actions";

const Fragrances: React.FC = () => {
  const context = useContext(ShopContext);
  if (!context) return null;
  const { products, currency } = context;

  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("relevant");

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
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const checkboxClasses = `
    w-4 h-4 appearance-none border border-gray-400 rounded
    checked:bg-gold-base checked:border-gold-base
    relative cursor-pointer transition-all duration-200
    checked:after:content-['✔'] checked:after:text-white
    checked:after:text-[10px] checked:after:absolute
    checked:after:left-[2px] checked:after:top-[-1px]
  `;

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-12 pt-10 border-t dark:border-zinc-800 dark:text-white px-4 sm:px-[5vw] md:px-[3vw] lg:px-[4vw]">
      {/* FILTER SIDEBAR */}
      <div className="min-w-60">
        <div
          onClick={() => setShowFilter((s) => !s)}
          className="my-2 text-xl cursor-pointer flex items-center justify-between sm:justify-start gap-2 font-medium bg-gray-50 dark:bg-zinc-900/50 sm:bg-transparent sm:dark:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none select-none active:scale-[0.98] sm:active:scale-100 transition-all"
        >
          <span>FILTERS</span>
          <ArrowRight
            size={18}
            className={`transition-transform duration-300 sm:hidden ${
              showFilter ? "rotate-90 text-gold-base" : "rotate-0 text-gray-500"
            }`}
          />
        </div>

        {/* حاوية الفلاتر بالأنيميشن (Grid Trick) */}
        <div
          className={`grid transition-all duration-300 ease-in-out sm:grid-rows-[1fr] sm:opacity-100 ${
            showFilter
              ? "grid-rows-[1fr] opacity-100 mt-4 sm:mt-0"
              : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden flex flex-col gap-4 sm:gap-5 sm:mt-6">
            {/* CATEGORIES */}
            <div className="border border-gray-200 dark:border-zinc-800 rounded-lg px-5 py-4 bg-white dark:bg-zinc-950/50 shadow-sm sm:shadow-none">
              <p className="mb-4 font-medium text-sm text-gold-base uppercase tracking-widest">
                Categories
              </p>
              <div className="flex flex-col gap-3 text-sm font-light">
                {dbCategories.map((cat) => (
                  <label
                    key={cat.id}
                    className="flex gap-3 items-center cursor-pointer group w-fit"
                  >
                    <input
                      type="checkbox"
                      className={checkboxClasses}
                      checked={selectedCategories.includes(
                        cat.name.toLowerCase()
                      )}
                      onChange={() => toggleCategory(cat.name.toLowerCase())}
                    />
                    <span className="group-hover:text-gold-base transition-colors duration-200">
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* SUBCATEGORY (TYPE) */}
            <div className="border border-gray-200 dark:border-zinc-800 rounded-lg px-5 py-4 bg-white dark:bg-zinc-950/50 shadow-sm sm:shadow-none">
              <p className="mb-4 font-medium text-sm text-gold-base uppercase tracking-widest">
                Type
              </p>
              <div className="flex flex-col gap-3 text-sm font-light">
                {["niche", "designer"].map((sub) => (
                  <label
                    key={sub}
                    className="flex gap-3 items-center cursor-pointer group w-fit"
                  >
                    <input
                      type="checkbox"
                      className={checkboxClasses}
                      checked={subCategories.includes(sub)}
                      onChange={() => toggleSubCategory(sub)}
                    />
                    <span className="group-hover:text-gold-base transition-colors duration-200">
                      {sub.charAt(0).toUpperCase() + sub.slice(1)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: PRODUCTS LIST */}
      <div className="flex-1 pb-16 mt-8 sm:mt-0">
        {/* HEADER & SORTING */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-base sm:text-2xl mb-6 gap-4">
          <Title text1="ALL" text2="FRAGRANCES" />

          <select
            className="border border-gray-300 dark:border-zinc-700 rounded px-3 py-2 text-sm dark:bg-zinc-900 dark:text-white outline-none focus:border-gold-base transition-colors cursor-pointer w-full sm:w-auto"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Price (Low to High)</option>
            <option value="high-low">Sort by: Price (High to Low)</option>
          </select>
        </div>

        {/* PRODUCTS GRID */}
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
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <span className="text-4xl">🪹</span>
            <p>No fragrances found matching these filters.</p>
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
                      ? "bg-gold-base text-white border-gold-base shadow-sm"
                      : "border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
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
