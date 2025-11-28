import React, { useState, useContext, useEffect, useRef } from "react";
import { ShopContext } from "../context/ShopContext";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const { searchOpen, closeSearch, products } = useContext(ShopContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const boxRef = useRef(null);

  /** ---------------- CLOSE ON OUTSIDE CLICK ---------------- **/
  useEffect(() => {
    const handleClick = (e) => {
      if (searchOpen && boxRef.current && !boxRef.current.contains(e.target)) {
        closeSearch();
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [searchOpen]);

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
        className="w-full border dark:border-gray-800 px-3 py-2 rounded-md dark:text-white"
        placeholder="Search for fragrances..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
        {results.map((item) => (
          <button
            key={item.id}
            className="w-full text-left p-3 rounded-md bg-white/70 backdrop-blur-sm shadow hover:bg-white"
            onClick={() => {
              navigate(`/product/${item.id}`);
              closeSearch();
              setQuery("");
            }}
          >
            <div className="flex items-center gap-3">
              <img
                src={item.image[0]}
                alt={item.name}
                className="w-10 h-10 object-cover rounded"
              />
              <p className="text-sm font-medium">{item.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;
