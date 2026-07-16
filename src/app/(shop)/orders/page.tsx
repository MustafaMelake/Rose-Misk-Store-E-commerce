"use client";

import React, { useContext } from "react";
import Image from "next/image";
import { ShopContext } from "../../../context/ShopContext";
import Title from "../../../components/Title";
import Footer from "@/components/Footer";
import { formatPrice } from "@/lib/format";

interface OrderItem {
  id: string | number;
  name: string;
  image: string | string[];
  size: string;
  quantity: number | string;
  price: number | string;
}

interface NormalizedItem {
  id: string | number;
  name: string;
  image: string;
  size: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string | number;
  date: string;
  status: string;
  items: OrderItem[];
  payment: string;
  total: number | string;
  shippingFee?: number;
  governorate?: string;
}

const Orders: React.FC = () => {
  const context = useContext(ShopContext);

  if (!context) return null;

  const { currency, userOrders } = context;

  const normalizeOrderItems = (items: OrderItem[]): NormalizedItem[] => {
    if (Array.isArray(items)) {
      return items.map((it) => ({
        id: it.id,
        name: it.name,
        image: Array.isArray(it.image) ? it.image[0] : it.image,
        size: it.size,
        quantity: Number(it.quantity) || 0,
        price: Number(it.price) || 0,
      }));
    }
    return [];
  };

  const formatStatus = (status: string) => {
    return status
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "DELIVERED":
      case "PAID":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      case "SHIPPED":
        return "bg-blue-500";
      case "AWAITING_PAYMENT":
      case "PENDING":
      default:
        return "bg-gold-base";
    }
  };

  return (
    <>
      <div className="py-10 text-black dark:text-white px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
        <div className="text-2xl mb-8">
          <Title text1={"YOUR"} text2={"ORDERS"} />
        </div>

        {userOrders.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-20 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl">
            No orders yet. Start shopping to see your history!
          </div>
        ) : (
          <div className="flex flex-col gap-8 mt-6">
            {userOrders.map((order: Order) => {
              const items = normalizeOrderItems(order.items);

              return (
                <div
                  key={order.id}
                  className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-zinc-900"
                >
                  {/* Header Section */}
                  <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 sm:px-6 flex justify-between items-center border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex flex-col sm:flex-row sm:gap-6">
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-medium">
                          Order Number
                        </p>
                        <h3 className="text-sm font-bold">#{order.id}</h3>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <p className="text-xs text-gray-400 uppercase font-medium">
                          Date Placed
                        </p>
                        <p className="text-sm">{order.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColorClass(
                          order.status
                        )}`}
                      />
                      <span className="text-sm font-semibold">
                        {formatStatus(order.status)}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 sm:p-6 flex flex-col gap-4">
                    {items.map((item, index) => (
                      <div
                        key={`${order.id}-${index}`}
                        className="flex items-center gap-4 py-2 last:border-0 border-b border-gray-50 dark:border-zinc-800"
                      >
                        <div className="relative w-20 h-20 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base truncate">
                            {item.name}
                          </p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            <p>
                              Size:{" "}
                              <span className="text-black dark:text-white font-medium">
                                {item.size}
                              </span>
                            </p>
                            <p>
                              Qty:{" "}
                              <span className="text-black dark:text-white font-medium">
                                {item.quantity}
                              </span>
                            </p>
                          </div>
                          <p className="sm:hidden font-bold text-gold-base mt-1">
                            {currency}
                            {formatPrice(item.price)}
                          </p>
                        </div>

                        <div className="hidden sm:block text-right">
                          <p className="font-bold text-gold-base">
                            {currency}
                            {formatPrice(item.price)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Subtotal: {currency}
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-100 dark:border-zinc-800 text-sm">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div>
                        <span className="text-gray-400">Payment: </span>
                        <span className="font-medium uppercase">
                          {order.payment}
                        </span>
                      </div>
                      {order.governorate &&
                        order.governorate !== "غير مححدد" && (
                          <div>
                            <span className="text-gray-400">Shipping to: </span>
                            <span className="font-medium text-gold-base">
                              {order.governorate}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:items-end gap-0.5">
                      {order.shippingFee !== undefined &&
                        order.shippingFee > 0 && (
                          <p className="text-xs text-gray-400">
                            Shipping Fee: {currency}
                            {formatPrice(order.shippingFee ?? 0)}
                          </p>
                        )}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-normal">
                          Grand Total:
                        </span>
                        <p className="font-bold text-xl text-black dark:text-white">
                          {currency}
                          {formatPrice(order.total ?? 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Orders;
