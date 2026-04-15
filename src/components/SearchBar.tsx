"use client";

import React, { useState, useContext, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { searchProducts } from "../../lib/actions/product.actions"; // استيراد الـ Action

const SearchBar: React.FC = () => {
  const context = useContext(ShopContext);
  const router = useRouter();

  const boxRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  if (!context) return null;
  const { searchOpen, closeSearch } = context;

  // إغلاق البحث عند الضغط خارج المربع
  useEffect(() => {
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

  // منطق البحث من الـ Database (مع Debounce)
  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }

    setLoading(true);

    // Debounce: استنى 300ms قبل ما تبعت Request للداتابيز
    const delayDebounceFn = setTimeout(async () => {
      const dbResults = await searchProducts(query);
      setResults(dbResults);
      setLoading(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!searchOpen) return null;

  return (
    <div
      ref={boxRef}
      className="fixed top-[70px] left-0 w-full bg-white dark:bg-black border-b shadow-lg z-50 px-4 py-3 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]"
    >
      <div className="relative">
        <input
          type="text"
          className="w-full border dark:border-gray-800 px-3 py-2 rounded-md dark:text-white bg-transparent outline-none focus:border-gold-base transition-colors"
          placeholder="Search for fragrances..."
          value={query}
          autoFocus
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
        />
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-gold-base border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
        {results.length > 0 ? (
          results.map((item) => (
            <button
              key={item.id}
              className="w-full text-left p-3 rounded-md bg-gray-50 dark:bg-zinc-900/50 backdrop-blur-sm shadow-sm hover:bg-gold-base/10 transition-all flex items-center gap-3"
              onClick={() => {
                router.push(`/product/${item.id}`);
                closeSearch();
                setQuery("");
              }}
            >
              <Image
                src={item.images[0] || "/placeholder.png"} // تأكد من اسم الحقل images
                alt={item.name}
                width={40}
                height={40}
                className="object-cover rounded shadow-sm h-10 w-10"
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
        ) : query.trim() !== "" && !loading ? (
          <p className="text-center text-sm text-gray-500 py-4">
            No fragrances found for "{query}"
          </p>
        ) : null}
      </div>
    </div>
  );
};

export default SearchBar;
