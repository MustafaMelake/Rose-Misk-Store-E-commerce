"use client";

import React, { useContext, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Package } from "lucide-react";
import { ShopContext } from "@/context/ShopContext";
import Footer from "@/components/Footer";
import { formatCurrency } from "@/lib/format";

/**
 * Order-confirmation / receipt page (G12). Replaces the transient success
 * `alert()` on checkout with a durable, shareable page. The just-placed order
 * is already in `ShopContext.userOrders` (placeOrder refreshes it); we also
 * refresh on mount so a hard reload repopulates it. Details are shown only when
 * the order belongs to the signed-in user (userOrders is owner-scoped), so an
 * arbitrary id in the URL never leaks another customer's data — it just falls
 * back to a generic confirmation.
 */
const OrderConfirmation = () => {
  const params = useParams();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const orderId = Number(rawId);

  const context = useContext(ShopContext);
  const refreshOrders = context?.refreshOrders;

  useEffect(() => {
    refreshOrders?.();
  }, [refreshOrders]);

  const order = context?.userOrders.find((o) => o.id === orderId);
  const itemCount =
    order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <>
      <div className="flex justify-center items-center min-h-[80vh] px-4 py-10 animate-fadeIn">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="text-emerald-500" size={34} />
            </div>
          </div>

          <h2 className="text-2xl prata-regular text-gold-base mb-2">
            Thank you! Your order has been received
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            We&apos;ll contact you to confirm delivery. Cash on Delivery.
          </p>

          {/* Receipt summary */}
          <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-5 mb-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 uppercase tracking-wider">
                Order Number
              </span>
              <span className="text-lg font-black text-black dark:text-white">
                #{Number.isFinite(orderId) ? orderId : "—"}
              </span>
            </div>

            {order && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    Date
                  </span>
                  <span className="text-sm font-medium dark:text-white">
                    {order.date}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    Items
                  </span>
                  <span className="text-sm font-medium dark:text-white">
                    {itemCount}
                  </span>
                </div>
                <div className="h-[1px] bg-gray-200 dark:bg-zinc-700" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-lg font-bold text-gold-base">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/orders"
              className="w-full py-3 bg-black dark:bg-gold-base text-white dark:text-black font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" /> Track my orders
            </Link>
            <Link
              href="/"
              className="w-full py-3 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default OrderConfirmation;
