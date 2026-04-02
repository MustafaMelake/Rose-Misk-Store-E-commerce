import React, { useState, useContext, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";
import { Product } from "../assets/assets"; // استيراد الـ Type الخاص بالمنتج

const SearchBar: React.FC = () => {
  // 1. الوصول للـ Context مع التأكد من وجوده
  const context = useContext(ShopContext);

  const navigate = useNavigate();

  // 2. تعريف الـ Refs مع تحديد نوع العنصر (HTMLDivElement)
  const boxRef = useRef<HTMLDivElement>(null);

  // 3. تعريف الـ States مع تحديد الأنواع
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<Product[]>([]);

  // حماية في حالة الـ context مش موجود
  if (!context) return null;
  const { searchOpen, closeSearch, products } = context;

  /** ---------------- CLOSE ON OUTSIDE CLICK ---------------- **/
  useEffect(() => {
    // تعريف نوع الـ event كـ MouseEvent
    const handleClick = (e: MouseEvent) => {
      if (
        searchOpen &&
        boxRef.current &&
        !boxRef.current.contains(e.target as Node)
      ) {
        closeSearch();
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen, closeSearch]);

  /** ---------------- FILTERING ---------------- **/
  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    );

    setResults(filtered);
  }, [query, products]);

  if (!searchOpen) return null;

  return (
    <div
      ref={boxRef}
      className="fixed top-[70px] left-0 w-full bg-white dark:bg-black border-b shadow-lg z-50 px-4 py-3 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]"
    >
      <input
        type="text"
        className="w-full border dark:border-gray-800 px-3 py-2 rounded-md dark:text-white bg-transparent outline-none focus:border-gold-base transition-colors"
        placeholder="Search for fragrances..."
        value={query}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setQuery(e.target.value)
        }
      />

      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
        {results.length > 0 ? (
          results.map((item) => (
            <button
              key={item.id}
              className="w-full text-left p-3 rounded-md bg-gray-50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm hover:bg-gold-base/10 transition-all flex items-center gap-3"
              onClick={() => {
                navigate(`/product/${item.id}`);
                closeSearch();
                setQuery("");
              }}
            >
              <img
                src={item.image[0]}
                alt={item.name}
                className="w-10 h-10 object-cover rounded shadow-sm"
              />
              <div>
                <p className="text-sm font-medium dark:text-white">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.company || "Rose Misk Collection"}
                </p>
              </div>
            </button>
          ))
        ) : query.trim() !== "" ? (
          <p className="text-center text-sm text-gray-500 py-4">
            No fragrances found for "{query}"
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default SearchBar;
