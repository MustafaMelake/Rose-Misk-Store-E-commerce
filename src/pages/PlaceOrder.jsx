import React, { useContext, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const PlaceOrder = () => {
  const {
    cartItems,
    products,
    currency,
    delivery_fee,
    placeOrder,
    getPriceBySize,
  } = useContext(ShopContext);

  /** ---------------- CART DATA ---------------- **/
  const cartData = useMemo(() => {
    let arr = [];
    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        const qty = cartItems[productId][size];
        if (qty <= 0) continue;

        const product = products.find((p) => p.id === Number(productId));
        if (!product) continue;

        arr.push({
          id: Number(productId),
          size,
          quantity: qty,
          name: product.name,
          price: getPriceBySize(productId, size),
          image: product.image[0],
        });
      }
    }
    return arr;
  }, [cartItems]);

  const subtotal = useMemo(
    () =>
      cartData.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartData]
  );
  const total = subtotal + delivery_fee;

  /** ---------------- PAYMENT ---------------- **/
  const [paymentMethod, setPaymentMethod] = useState("cod");

  return (
    <div className="py-10 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-black dark:text-white">
      {/* ---------------- LEFT SIDE: DELIVERY FORM ---------------- */}
      <div className="md:col-span-2 space-y-6">
        <h2 className="text-2xl font-semibold mb-6 tracking-wide">
          DELIVERY <span className="font-light">INFORMATION</span>
        </h2>

        <form className="flex flex-col gap-4">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First name"
              className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Last name"
              className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />

          {/* Street */}
          <input
            type="text"
            placeholder="Street"
            className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />

          {/* City / State */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="City"
              className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="State"
              className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Zipcode / Country */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Zipcode"
              className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Country"
              className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* Phone */}
          <input
            type="text"
            placeholder="Phone"
            className="inputStyle dark:bg-gray-900 dark:border-gray-700 dark:text-white"
          />
        </form>
      </div>

      {/* ---------------- RIGHT SIDE: CART SUMMARY ---------------- */}
      <div className="rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm dark:shadow-none p-6 bg-white dark:bg-gray-900">
        <h2 className="text-xl font-semibold tracking-wide mb-4">
          CART <span className="font-light">TOTALS</span>
        </h2>

        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
          <span>Subtotal</span>
          <span>
            {currency}
            {subtotal.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
          <span>Shipping Fee</span>
          <span>
            {currency}
            {delivery_fee.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between py-3 text-lg font-bold">
          <span>Total</span>
          <span>
            {currency}
            {total.toFixed(2)}
          </span>
        </div>

        {/* ---------------- PAYMENT METHOD ---------------- */}
        <h3 className="text-lg font-semibold tracking-wide mt-8 mb-3">
          PAYMENT <span className="font-light">METHOD</span>
        </h3>

        <div className="flex flex-col gap-3">
          {/* Cash On Delivery */}
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="payment"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
              className="accent-gold-base"
            />
            <span className="flex items-center gap-2 font-medium">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              CASH ON DELIVERY
            </span>
          </label>
        </div>

        <button
          onClick={() => placeOrder(cartItems, paymentMethod)}
          className="w-full mt-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gold-base hover:text-black transition"
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

export default PlaceOrder;
