"use client";

import React, { useContext, useMemo, useState } from "react";
import { ShopContext } from "../../../context/ShopContext";
import { useRouter } from "next/navigation";
import {
  ALL_GOVERNORATES,
  calculateShippingFee,
} from "@/lib/shipping";
import { formatCurrency } from "@/lib/format";

interface CartItem {
  id: number;
  size: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
}

interface DeliveryData {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone: string;
}

const PlaceOrder: React.FC = () => {
  const context = useContext(ShopContext);
  const router = useRouter();

  if (!context) return null;

  const { cartItems, products, placeOrder, getPriceBySize } = context;

  const [loading, setLoading] = useState(false);
  // COD is the only payment method (G6); no gateway is wired, so there is no
  // choice to make and nothing to reject later.
  const paymentMethod = "COD";

  // Checkout error surfaces (G11): a form-level banner and per-field messages
  // keyed by the server's order-input field names.
  const [formError, setFormError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** ---------------- DELIVERY FORM STATE ---------------- **/
  const [formData, setFormData] = useState<DeliveryData>({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** ---------------- CART DATA PROCESSING ---------------- **/
  const cartData = useMemo<CartItem[]>(() => {
    let arr: CartItem[] = [];
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
          image: product.images[0],
        });
      }
    }
    return arr;
  }, [cartItems, products, getPriceBySize]);

  const subtotal = useMemo(
    () =>
      cartData.reduce((total, item) => total + item.price * item.quantity, 0),
    [cartData]
  );

  const dynamicDeliveryFee = formData.state
    ? calculateShippingFee(formData.state)
    : 0;
  const total = subtotal + dynamicDeliveryFee;

  /** ---------------- SUBMIT HANDLER ---------------- **/
  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (cartData.length === 0) {
      setFormError("Your cart is empty. Add some fragrances first!");
      return;
    }

    setLoading(true);
    try {
      const result = await placeOrder(
        cartItems,
        paymentMethod,
        formData,
        total
      );

      if (result && result.success && result.orderId) {
        // G12: land on a real confirmation/receipt page instead of a transient
        // alert. placeOrder has already refreshed ShopContext.userOrders, so the
        // confirmation page can show the order's details.
        router.push(`/order-confirmation/${result.orderId}`);
        return;
      }

      // G11: show per-field Arabic errors under the inputs.
      setFieldErrors(result?.fieldErrors ?? {});
      if (result?.reason === "unavailable") {
        // G10: unavailable lines were dropped from the cart — tell the shopper.
        setFormError(
          "Some items are no longer available, so they were removed from your cart. Please review your order and try again."
        );
      } else {
        setFormError(
          result?.message || "Something went wrong while placing your order. Please try again."
        );
      }
    } catch (error) {
      console.error("Order Submission Error:", error);
      setFormError("Something went wrong while placing your order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Small helper for a per-field error line under an input.
  const FieldError = ({ name }: { name: string }) =>
    fieldErrors[name] ? (
      <p className="text-xs text-red-500 mt-1">
        {fieldErrors[name]}
      </p>
    ) : null;
  return (
    <div className="py-10 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-black dark:text-white animate-fadeIn">
      {/* ---------------- LEFT SIDE: DELIVERY FORM ---------------- */}
      <div className="md:col-span-2">
        <form id="order-form" onSubmit={onSubmitHandler} className="space-y-8">
          {formError && (
            <p
              className="bg-red-50 dark:bg-red-900/20 text-red-500 p-3 rounded-xl text-sm text-center border border-red-100 dark:border-red-900/30"
            >
              {formError}
            </p>
          )}
          <div>
            <h2 className="text-2xl font-semibold mb-6 tracking-wide flex items-center gap-2">
              DELIVERY{" "}
              <span className="font-light text-gray-400">INFORMATION</span>
            </h2>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  name="firstName"
                  value={formData.firstName}
                  onChange={onChangeHandler}
                  type="text"
                  placeholder="First name"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
                />
                <input
                  required
                  name="lastName"
                  value={formData.lastName}
                  onChange={onChangeHandler}
                  type="text"
                  placeholder="Last name"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
                />
              </div>
              <FieldError name="customerName" />
              <input
                required
                name="email"
                value={formData.email}
                onChange={onChangeHandler}
                type="email"
                placeholder="Email address"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
              />
              <FieldError name="customerEmail" />
              <input
                required
                name="street"
                value={formData.street}
                onChange={onChangeHandler}
                type="text"
                placeholder="Street / Apartment"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
              />
              <FieldError name="address" />
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  name="city"
                  value={formData.city}
                  onChange={onChangeHandler}
                  type="text"
                  placeholder="City"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
                />
                <select
                  required
                  name="state"
                  value={formData.state}
                  onChange={(e: any) => onChangeHandler(e)}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all appearance-none"
                >
                  <option value="" disabled>
                    Select governorate
                  </option>
                  {ALL_GOVERNORATES.map((gov) => (
                    <option key={gov} value={gov}>
                      {gov}
                    </option>
                  ))}
                </select>
              </div>
              <FieldError name="governorate" />
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="zipcode"
                  value={formData.zipcode}
                  onChange={onChangeHandler}
                  type="text"
                  placeholder="Zipcode (Optional)"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
                />
                <input
                  required
                  name="country"
                  value={formData.country}
                  onChange={onChangeHandler}
                  type="text"
                  placeholder="Country"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
                />
              </div>
              <input
                required
                name="phone"
                value={formData.phone}
                onChange={onChangeHandler}
                type="tel"
                placeholder="Phone (e.g. 01xxxxxxxxx)"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
              />
              <FieldError name="customerPhone" />
            </div>
          </div>
        </form>
      </div>

      {/* ---------------- RIGHT SIDE: CART SUMMARY ---------------- */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xl p-6 bg-white dark:bg-zinc-900/50 backdrop-blur-sm">
          <h2 className="text-xl font-semibold tracking-wide mb-6">
            ORDER <span className="font-light">SUMMARY</span>
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm">
              <span>Shipping Fee</span>
              <span>
                {dynamicDeliveryFee === 0
                  ? "Select governorate"
                  : formatCurrency(dynamicDeliveryFee)}
              </span>
            </div>
            <div className="h-[1px] bg-gray-100 dark:bg-zinc-800 my-2"></div>
            <div className="flex justify-between text-lg font-bold text-black dark:text-white">
              <span>Total</span>
              <span className="text-gold-base">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* ---------------- PAYMENT METHOD ---------------- */}
          <h3 className="text-xs font-bold uppercase tracking-widest mt-10 mb-4 text-gray-400">
            Payment Method
          </h3>

          <div className="flex flex-col gap-3">
            {/* COD-only: a fixed method, not a choice (G6). */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gold-base bg-gold-base/5">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full border-2 border-gold-base flex items-center justify-center shrink-0">
                  <span className="w-2 h-2 bg-gold-base rounded-full"></span>
                </span>
                <span className="font-medium text-sm">Cash On Delivery</span>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-[11px] text-gray-400 pr-1">
              Cash on Delivery is the only payment method available right now.
            </p>
          </div>

          <button
            form="order-form"
            disabled={loading}
            type="submit"
            className={`w-full mt-8 py-4 bg-black dark:bg-gold-base text-white dark:text-black font-bold rounded-xl transition-all shadow-lg shadow-gold-base/10 flex items-center justify-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:scale-[1.02]"
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                PROCESSING...
              </>
            ) : (
              "PLACE ORDER"
            )}
          </button>
        </div>
        <p className="text-[10px] text-center text-gray-400 uppercase tracking-tighter">
          Secure Checkout • Rose Misk Fragrances
        </p>
      </div>
    </div>
  );
};

export default PlaceOrder;
