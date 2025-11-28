import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";

const Product = () => {
  const { id } = useParams();
  const { products, currency, addToCart, getPriceBySize } =
    useContext(ShopContext);

  const [productItem, setProductItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    if (!selectedSize) {
      setError("Select Size");
      return;
    }

    addToCart(productItem.id, selectedSize);

    setError("");
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const item = products.find((p) => p.id === Number(id));
      if (item) {
        setProductItem({
          ...item,
          rating: item?.rating || 0,
          reviews: item?.reviews || 0,
        });
      }
    }
  }, [id, products]);

  if (!productItem) return <div>Product not found</div>;

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {Array(fullStars)
          .fill(0)
          .map((_, i) => (
            <span key={"full" + i} className="text-gold-base text-xl">
              ★
            </span>
          ))}
        {halfStar && <span className="text-gold-base text-xl">☆</span>}
        {Array(emptyStars)
          .fill(0)
          .map((_, i) => (
            <span
              key={"empty" + i}
              className="text-gray-400 dark:text-gray-600 text-xl"
            >
              ★
            </span>
          ))}
      </div>
    );
  };

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-10 
        text-black dark:text-white"
    >
      {/* Image */}
      <div className="w-full">
        <img
          src={productItem.image[0]}
          alt={productItem.name}
          className="w-full rounded-3xl shadow-lg dark:shadow-none"
        />
      </div>

      {/* Right Section */}
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-semibold">{productItem.name}</h1>

        <div className="flex items-center gap-2">
          {renderStars(productItem.rating)}
          <span className="text-gray-600 dark:text-gray-300 font-medium">
            {productItem.rating.toFixed(1)} ({productItem.reviews})
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-300">
          {productItem.description}
        </p>

        {/* Dynamic Price */}
        <p className="text-3xl text-gold-base">
          {currency}
          {selectedSize
            ? getPriceBySize(productItem.id, selectedSize).toFixed(2)
            : productItem.price.toFixed(2)}
        </p>

        {/* Sizes */}
        <div>
          <p className="font-semibold mb-2">Available Sizes</p>
          <div className="flex gap-3">
            {productItem.size.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                className={`
                  px-4 py-2 border rounded-xl transition cursor-pointer 
                  border-gray-400 dark:border-gray-600
                  ${
                    selectedSize === s
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                  }
                `}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Add to Cart */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleAdd}
            className={`
              w-full py-3 rounded-xl transition cursor-pointer text-lg font-medium
              ${
                added
                  ? "bg-gold-base text-black"
                  : "bg-black text-white dark:bg-white dark:text-black hover:bg-gold-base hover:text-black"
              }
            `}
          >
            {added ? "✓ Added" : "Add to Cart"}
          </button>

          {error && (
            <span className="text-red-500 text-sm font-medium">{error}</span>
          )}
        </div>

        {/* More Products */}
        {products && products.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-6">
              More from {productItem.company}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {products
                .filter(
                  (p) =>
                    p.company === productItem.company && p.id !== productItem.id
                )
                .map((p) => (
                  <ProductItem
                    key={p.id}
                    id={p.id}
                    image={p.image}
                    name={p.name}
                    price={p.price}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
