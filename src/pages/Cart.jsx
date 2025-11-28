import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Trash2 } from "lucide-react";
import Title from "../components/Title";
import CheckOut from "../components/CheckOut";

const Cart = () => {
  const { products, currency, cartItems, setCartItems, getPriceBySize } =
    useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    let tempData = [];
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        const quantity = cartItems[productId][size];
        if (quantity > 0) {
          const product = products.find((p) => p.id === Number(productId));
          if (product) {
            tempData.push({
              id: Number(productId),
              size,
              quantity,
              name: product.name,
              price: getPriceBySize(productId, size),
              image: product.image[0],
            });
          }
        }
      }
    }

    setCartData(tempData);
  }, [cartItems]);

  const updateQuantity = (productId, size, delta) => {
    const newCart = structuredClone(cartItems);
    newCart[productId][size] = Math.max(1, newCart[productId][size] + delta);
    setCartItems(newCart);
  };

  const removeItem = (productId, size) => {
    const newCart = structuredClone(cartItems);
    delete newCart[productId][size];
    if (Object.keys(newCart[productId]).length === 0) delete newCart[productId];
    setCartItems(newCart);
  };

  if (cartData.length === 0)
    return (
      <div className="py-20 text-center text-gray-600 dark:text-gray-300">
        Your cart is empty
      </div>
    );

  return (
    <div className="py-10 flex flex-col gap-8 text-black dark:text-white">
      <div className="text-base sm:text-2xl  text-3xl">
        <Title text1="Shopping" text2={"Cart"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products List */}
        <div className="flex flex-col gap-6">
          {cartData.map((item) => (
            <div
              key={`${item.id}-${item.size}`}
              className="
                flex items-center gap-4 p-4 
                border rounded-xl shadow-sm 
                bg-white dark:bg-black 
                border-gray-300 dark:border-gray-700"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-xl"
              />

              <div className="flex-1 flex flex-col">
                <h2 className="font-semibold">{item.name}</h2>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Size: {item.size}
                </p>

                <p className="mt-1 text-gold-base font-semibold">
                  {currency}
                  {item.price}
                </p>

                {/* Quantity controls */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.size, -1)}
                    className="
                      px-2 py-1 border rounded 
                      border-gray-400 dark:border-gray-600
                      hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    -
                  </button>

                  <span className="px-2">{item.quantity}</span>

                  <button
                    onClick={() => updateQuantity(item.id, item.size, 1)}
                    className="
                      px-2 py-1 border rounded 
                      border-gray-400 dark:border-gray-600
                      hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    +
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => removeItem(item.id, item.size)}
                    className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <CheckOut />
      </div>
    </div>
  );
};

export default Cart;
