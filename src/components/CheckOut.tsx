import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const CheckOut: React.FC = () => {
  const context = useContext(ShopContext);

  if (!context) return null;

  const { currency, delivery_fee, subtotal, total, goToCheckout } = context;

  return (
    <div className="p-6 border rounded-xl shadow-sm h-fit flex flex-col gap-4 bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <h2 className="text-2xl font-semibold dark:text-white">Order Summary</h2>

      <div className="flex justify-between dark:text-gray-300">
        <span>Subtotal:</span>
        <span className="font-medium">
          {currency}
          {subtotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between dark:text-gray-300">
        <span>Delivery Fee:</span>
        <span className="font-medium">
          {currency}
          {delivery_fee.toFixed(2)}
        </span>
      </div>

      <hr className="my-2 border-gray-100 dark:border-zinc-800" />

      <div className="flex justify-between font-bold text-lg dark:text-gold-base">
        <span>Total:</span>
        <span>
          {currency}
          {total.toFixed(2)}
        </span>
      </div>

      <button
        onClick={goToCheckout}
        className="mt-4 w-full py-3 bg-black text-white rounded-xl hover:bg-gold-base hover:text-black transition-all duration-300 font-medium dark:bg-gold-base dark:text-black dark:hover:bg-white"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CheckOut;
