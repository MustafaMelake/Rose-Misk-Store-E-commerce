"use client";

import React, { useContext, useMemo, useState } from "react";
import { ShopContext } from "../../context/ShopContext";
// استيراد دالة Stripe اللي عملناها
import { createCheckoutSession } from "../../../lib/actions/stripe";

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

  if (!context) return null;

  const {
    cartItems,
    products,
    currency,
    delivery_fee,
    placeOrder,
    getPriceBySize,
  } = context;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("cod");

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

  const total = subtotal + delivery_fee;

  /** ---------------- SUBMIT HANDLER ---------------- **/
  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartData.length === 0) {
      alert("سلتك فارغة، أضف بعض العطور أولاً!");
      return;
    }

    setLoading(true);
    try {
      // 1. حفظ الطلب في قاعدة البيانات أولاً والحصول على رقم الطلب
      const orderId = await placeOrder(
        cartItems,
        paymentMethod,
        formData,
        total
      );

      // 2. التحقق من وسيلة الدفع
      if (paymentMethod === "stripe" && orderId) {
        // لو الدفع إلكتروني، هنكلم Stripe
        const { url } = await createCheckoutSession(
          orderId.toString(),
          total,
          cartData
        );
        if (url) {
          // تحويل العميل لصفحة الدفع الخاصة بـ Stripe
          window.location.href = url;
        }
      } else {
        // لو الدفع عند الاستلام (COD)، التوجيه هيكون تم من داخل دالة placeOrder في الـ Context
        console.log("COD Order placed successfully");
      }
    } catch (error) {
      console.error("Order Submission Error:", error);
      alert("حدث خطأ أثناء تنفيذ الطلب، حاول مرة أخرى.");
      setLoading(false); // بنوقف التحميل هنا بس عشان لو راح Stripe الصفحة هتحمل لوحدها
    }
  };

  return (
    <div className="py-10 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-black dark:text-white animate-fadeIn">
      {/* ---------------- LEFT SIDE: DELIVERY FORM ---------------- */}
      <div className="md:col-span-2">
        <form id="order-form" onSubmit={onSubmitHandler} className="space-y-8">
          {/* نفس كود الفورم بتاعك بدون أي تغيير */}
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
              <input
                required
                name="email"
                value={formData.email}
                onChange={onChangeHandler}
                type="email"
                placeholder="Email address"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
              />
              <input
                required
                name="street"
                value={formData.street}
                onChange={onChangeHandler}
                type="text"
                placeholder="Street / Apartment"
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
              />
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
                <input
                  required
                  name="state"
                  value={formData.state}
                  onChange={onChangeHandler}
                  type="text"
                  placeholder="State / Governorate"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 outline-none focus:border-gold-base transition-all"
                />
              </div>
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
              <span>
                {currency} {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400 text-sm">
              <span>Shipping Fee</span>
              <span>
                {currency} {delivery_fee.toFixed(2)}
              </span>
            </div>
            <div className="h-[1px] bg-gray-100 dark:bg-zinc-800 my-2"></div>
            <div className="flex justify-between text-lg font-bold text-black dark:text-white">
              <span>Total</span>
              <span className="text-gold-base">
                {currency} {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ---------------- PAYMENT METHOD ---------------- */}
          <h3 className="text-xs font-bold uppercase tracking-widest mt-10 mb-4 text-gray-400">
            Payment Method
          </h3>

          <div className="flex flex-col gap-3">
            {/* خيار الدفع عند الاستلام */}
            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                paymentMethod === "cod"
                  ? "border-gold-base bg-gold-base/5"
                  : "border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-gold-base w-4 h-4"
                />
                <span className="font-medium text-sm">Cash On Delivery</span>
              </div>
              {paymentMethod === "cod" && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </label>

            {/* خيار الدفع بالفيزا (Stripe) */}
            <label
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                paymentMethod === "stripe"
                  ? "border-gold-base bg-gold-base/5"
                  : "border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "stripe"}
                  onChange={() => setPaymentMethod("stripe")}
                  className="accent-gold-base w-4 h-4"
                />
                <span className="font-medium text-sm">Credit / Debit Card</span>
              </div>
              {paymentMethod === "stripe" && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </label>
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
