import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const CheckOut: React.FC = () => {
  const context = useContext(ShopContext);

  if (!context) return null;

  // شلنا استدعاء delivery_fee و total لأن حسابهم النهائي هيتم في شاشة الدفع
  const { currency, subtotal, goToCheckout } = context;

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

      <div className="flex justify-between dark:text-gray-300 items-center">
        <span>Delivery Fee:</span>
        <span className="text-[11px] bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 px-2 py-1 rounded-md font-medium">
          Calculated at checkout
        </span>
      </div>

      <hr className="my-2 border-gray-100 dark:border-zinc-800" />

      <div className="flex justify-between font-bold text-lg dark:text-gold-base items-end">
        <div className="flex flex-col">
          <span>Total:</span>
          <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500 tracking-wider uppercase">
            Excludes Delivery
          </span>
        </div>
        <span>
          {currency}
          {subtotal.toFixed(2)}
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
