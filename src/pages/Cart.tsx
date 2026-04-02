import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Trash2 } from "lucide-react";
import Title from "../components/Title";
import CheckOut from "../components/CheckOut";

// 1. تعريف واجهة (Interface) للعنصر اللي هيتعرض في السلة
interface CartDisplayItem {
  id: number;
  size: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
}

const Cart: React.FC = () => {
  // 2. سحب البيانات من الـ Context مع حماية الـ Null
  const context = useContext(ShopContext);
  if (!context) return null;

  const { products, currency, cartItems, setCartItems, getPriceBySize } =
    context;

  // 3. تحديد نوع الـ State بـ Array من الواجهة اللي عملناها
  const [cartData, setCartData] = useState<CartDisplayItem[]>([]);

  useEffect(() => {
    const tempData: CartDisplayItem[] = [];

    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        const quantity = cartItems[productId][size];
        if (quantity > 0) {
          const product = products.find(
            (p) => Number(p.id) === Number(productId)
          );
          if (product) {
            tempData.push({
              id: Number(productId),
              size,
              quantity,
              name: product.name,
              price: getPriceBySize(productId, size),
              // التأكد إن الصورة هترجع كـ String لو كانت Array
              image: Array.isArray(product.image)
                ? product.image[0]
                : product.image,
            });
          }
        }
      }
    }

    setCartData(tempData);
  }, [cartItems, products, getPriceBySize]); // إضافة الـ dependencies الصح للـ useEffect

  // 4. تحديد أنواع البارامترات في دوال التعديل والمسح
  const updateQuantity = (productId: number, size: string, delta: number) => {
    const newCart = structuredClone(cartItems);
    const idStr = String(productId);

    // التأكد إن العنصر موجود قبل ما نعدل عليه عشان TypeScript ميزعلش
    if (newCart[idStr] && newCart[idStr][size] !== undefined) {
      newCart[idStr][size] = Math.max(1, newCart[idStr][size] + delta);
      setCartItems(newCart);
    }
  };

  const removeItem = (productId: number, size: string) => {
    const newCart = structuredClone(cartItems);
    const idStr = String(productId);

    if (newCart[idStr] && newCart[idStr][size] !== undefined) {
      delete newCart[idStr][size];
      // لو الـ Object بتاع المنتج ده فضي، امسحه خالص
      if (Object.keys(newCart[idStr]).length === 0) {
        delete newCart[idStr];
      }
      setCartItems(newCart);
    }
  };

  if (cartData.length === 0)
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 gap-4 animate-fadeIn">
        <p className="text-xl font-medium">Your cart is empty</p>
        <p className="text-sm">
          Browse our collection and add some fragrances!
        </p>
      </div>
    );

  return (
    <div className="py-10 flex flex-col gap-8 text-black dark:text-white px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <div className="text-2xl sm:text-3xl">
        <Title text1="Shopping" text2={"Cart"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products List (Takes up 2 columns on large screens) */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {cartData.map((item) => (
            <div
              key={`${item.id}-${item.size}`}
              className="
                flex items-center gap-4 p-4 
                border rounded-xl shadow-sm hover:shadow-md transition-shadow
                bg-white dark:bg-zinc-900 
                border-gray-100 dark:border-zinc-800"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border dark:border-zinc-800"
              />

              <div className="flex-1 flex flex-col">
                <h2 className="font-semibold text-lg">{item.name}</h2>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Size:{" "}
                  <span className="font-medium text-black dark:text-gray-200">
                    {item.size}
                  </span>
                </p>

                <p className="mt-1 text-gold-base font-semibold">
                  {currency}
                  {item.price.toFixed(2)}
                </p>

                {/* Quantity controls */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.size, -1)}
                      className="px-3 py-1 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition text-lg leading-none"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-sm font-medium border-x border-gray-200 dark:border-zinc-700">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.size, 1)}
                      className="px-3 py-1 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition text-lg leading-none"
                    >
                      +
                    </button>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeItem(item.id, item.size)}
                    className="ml-auto p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Component (Takes 1 column on large screens) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <CheckOut />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
