import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

const CheckOut = () => {
  const { currency, delivery_fee, subtotal, total, goToCheckout } =
    useContext(ShopContext);

  return (
    <div className="p-6 border rounded-xl shadow-sm h-fit flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Order Summary</h2>

      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span>
          {currency}
          {subtotal.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between">
        <span>Delivery Fee:</span>
        <span>
          {currency}
          {delivery_fee.toFixed(2)}
        </span>
      </div>

      <hr className="my-2" />

      <div className="flex justify-between font-bold text-lg">
        <span>Total:</span>
        <span>
          {currency}
          {total.toFixed(2)}
        </span>
      </div>

      <button
        onClick={goToCheckout}
        className="mt-4 w-full py-3 bg-black text-white rounded-xl hover:bg-gold-base hover:text-black transition dark:bg-gold-dark-20"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

export default CheckOut;
