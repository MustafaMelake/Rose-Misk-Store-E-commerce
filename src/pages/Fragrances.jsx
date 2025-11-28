import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { ArrowRight } from "lucide-react";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const Fragrances = () => {
  const { products } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [season, setSeason] = useState([]);
  const [sortBy, setSortBy] = useState("relevant");

  const toggleCategory = (value) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSubCategory = (value) => {
    setSubCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const toggleSeason = (value) => {
    setSeason((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  const applyFilter = () => {
    let result = products.slice();

    if (categories.length > 0) {
      result = result.filter(
        (p) => p.category && categories.includes(p.category.toLowerCase())
      );
    }

    if (subCategories.length > 0) {
      result = result.filter(
        (p) =>
          p.Subcategory && subCategories.includes(p.Subcategory.toLowerCase())
      );
    }

    if (season.length > 0) {
      result = result.filter(
        (p) => p.season && season.includes(p.season.toLowerCase())
      );
    }

    if (sortBy === "high-low") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "low-high") {
      result.sort((a, b) => a.price - b.price);
    }

    setFilteredProducts(result);
  };

  useEffect(() => {
    applyFilter();
  }, [products, categories, subCategories, sortBy, season]);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-12 pt-10 border-t dark:text-white">
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
        {/* ******** */}
        <div
          className={`border border-gray-400 pl-5 py-3 mt-3 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 font-medium text-sm">CATEGORIES </p>
          <div className="flex flex-col gap-2 text-sm font-light">
            <label className="flex gap-2">
              <input
                type="checkbox"
                className="
      w-4 h-4 
      appearance-none 
      border border-gray-400 rounded
      checked:bg-gold-base checked:border-gold-base
      relative cursor-pointer
      checked:after:content-['✔']
      checked:after:text-white
      checked:after:text-[10px]
      checked:after:absolute
      checked:after:left-[2px]
      checked:after:top-[-1px]
    "
                checked={categories.includes("men")}
                onChange={() => toggleCategory("men")}
              />
              Men
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                className="
      w-4 h-4 
      appearance-none 
      border border-gray-400 rounded
      checked:bg-gold-base checked:border-gold-base
      relative cursor-pointer
      checked:after:content-['✔']
      checked:after:text-white
      checked:after:text-[10px]
      checked:after:absolute
      checked:after:left-[2px]
      checked:after:top-[-1px]
    "
                checked={categories.includes("women")}
                onChange={() => toggleCategory("women")}
              />
              Women
            </label>
            <label className="flex gap-2">
              <input
                type="checkbox"
                className="
      w-4 h-4 
      appearance-none 
      border border-gray-400 rounded
      checked:bg-gold-base checked:border-gold-base
      relative cursor-pointer
      checked:after:content-['✔']
      checked:after:text-white
      checked:after:text-[10px]
      checked:after:absolute
      checked:after:left-[2px]
      checked:after:top-[-1px]
    "
                checked={categories.includes("unsex")}
                onChange={() => toggleCategory("unsex")}
              />
              Unsex
            </label>
          </div>
        </div>
        {/* ********* */}
        <div
          className={`border border-gray-400 pl-5 py-3 mt-3 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 font-medium text-sm">SUBCATEGORY</p>
          <div className="flex flex-col gap-2 text-sm font-light">
            <label className="flex gap-2">
              <input
                type="checkbox"
                className="
      w-4 h-4 
      appearance-none 
      border border-gray-400 rounded
      checked:bg-gold-base checked:border-gold-base
      relative cursor-pointer
      checked:after:content-['✔']
      checked:after:text-white
      checked:after:text-[10px]
      checked:after:absolute
      checked:after:left-[2px]
      checked:after:top-[-1px]
    "
                checked={subCategories.includes("niche")}
                onChange={() => toggleSubCategory("niche")}
              />
              Niche
            </label>

            <label className="flex gap-2">
              <input
                type="checkbox"
                className="
      w-4 h-4 
      appearance-none 
      border border-gray-400 rounded
      checked:bg-gold-base checked:border-gold-base
      relative cursor-pointer
      checked:after:content-['✔']
      checked:after:text-white
      checked:after:text-[10px]
      checked:after:absolute
      checked:after:left-[2px]
      checked:after:top-[-1px]
    "
                checked={subCategories.includes("designer")}
                onChange={() => toggleSubCategory("designer")}
              />
              Designer
            </label>
          </div>
        </div>
        {/* ********** */}
        <div
          className={`border border-gray-400 pl-5 py-3 mt-3 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 font-medium text-sm">SEASON</p>
          <div className="flex flex-col gap-2 text-sm font-light">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={season.includes("winter")}
                onChange={() => toggleSeason("winter")}
                className="
      w-4 h-4 
      appearance-none 
      border border-gray-400 rounded
      checked:bg-gold-base checked:border-gold-base
      relative cursor-pointer
      checked:after:content-['✔']
      checked:after:text-white
      checked:after:text-[10px]
      checked:after:absolute
      checked:after:left-[2px]
      checked:after:top-[-1px]
    "
              />
              Winter
            </label>

            <label className="flex gap-2">
              <input
                type="checkbox"
                className="
      w-4 h-4 
      appearance-none 
      border border-gray-400 rounded
      checked:bg-gold-base checked:border-gold-base
      relative cursor-pointer
      checked:after:content-['✔']
      checked:after:text-white
      checked:after:text-[10px]
      checked:after:absolute
      checked:after:left-[2px]
      checked:after:top-[-1px]
    "
                checked={season.includes("summer")}
                onChange={() => toggleSeason("summer")}
              />
              Summer
            </label>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl px-2">
          <Title text1="ALL" text2="FRAGRANCES" />

          <select
            className="border px-2 text-sm dark:text-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="relevant" className="dark:text-black">
              Sort by: Relevant
            </option>
            <option value="high-low" className="dark:text-black">
              Sort by: High to Low
            </option>
            <option value="low-high" className="dark:text-black">
              Sort by: Low to High
            </option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filteredProducts.map((item) => (
            <ProductItem
              key={item.id}
              id={item.id}
              price={item.price}
              image={item.image}
              name={item.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Fragrances;
