"use client";

import React, { useEffect, useState } from "react";
import {
  getAllOrders,
  updateOrderStatus,
  OrderStatusType,
} from "../../../../lib/actions/order.actions";
import { OrderStatus } from "@prisma/client";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // 1. حالة الفلتر الحالية (الافتراضي: الكل)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "ALL">("ALL");

  useEffect(() => {
    const fetchOrders = async () => {
      const response = await getAllOrders();
      if (response.success && response.orders) {
        setOrders(response.orders);
      } else {
        alert(response.message || "فشل في جلب الطلبات");
      }
      setLoading(false);
    };

    fetchOrders();
  }, []);

  const handleStatusChange = async (
    orderId: number,
    newStatus: OrderStatusType
  ) => {
    setUpdatingId(orderId);

    const response = await updateOrderStatus(orderId, newStatus);

    if (response.success) {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } else {
      alert("حدث خطأ أثناء تحديث حالة الطلب");
    }

    setUpdatingId(null);
  };

  // 2. تصفية الطلبات بناءً على الفلتر المختار
  const filteredOrders = orders.filter((order) => {
    if (filterStatus === "ALL") return true;
    return order.status === filterStatus;
  });

  // 3. خيارات الفلترة المتاحة
  const filterOptions: (OrderStatus | "ALL")[] = [
    "ALL",
    "PENDING",
    "PAID",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black transition-colors duration-300">
        <div className="text-sm tracking-[0.2em] uppercase font-bold text-neutral-400 animate-pulse">
          Loading Orders...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors duration-300 flex-1 space-y-1 p-1 pt-1 font-sans">
      <div className="max-w-[1400px] mx-auto">
        {/* Header Section */}
        <div className="mb-8 border-b border-neutral-200 dark:border-neutral-800 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white prata-regular tracking-wide">
              Orders
              <span className="text-neutral-400 dark:text-neutral-600">.</span>
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-3 text-lg font-medium">
              إدارة الطلبات والعمليات ( {filteredOrders.length} طلب معروض من أصل{" "}
              {orders.length} )
            </p>
          </div>
        </div>

        {/* ---------------- FILTER BAR ---------------- */}
        <div className="mb-8 flex flex-wrap gap-2">
          {filterOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest rounded-lg border transition-all duration-300 ${
                filterStatus === status
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-md"
                  : "bg-transparent text-neutral-500 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 hover:text-black dark:hover:text-white"
              }`}
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
        {/* -------------------------------------------- */}

        {/* High-End Table */}
        <div className="w-full overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#050505] shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-5 px-6 text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
                  Identification
                </th>
                <th className="py-5 px-6 text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
                  Customer
                </th>
                <th className="py-5 px-6 text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
                  Manifest
                </th>
                <th className="py-5 px-6 text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
                  Total & Payment
                </th>
                <th className="py-5 px-6 text-[11px] font-bold tracking-widest text-neutral-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-16 text-center text-neutral-400 dark:text-neutral-600 font-medium tracking-wide"
                  >
                    لا توجد طلبات تطابق هذا التصنيف.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-neutral-50 dark:hover:bg-[#0a0a0a] transition-colors duration-200 group"
                  >
                    {/* Order ID & Date */}
                    <td className="py-6 px-6 align-top">
                      <div className="text-xl font-black text-black dark:text-white tracking-tight">
                        #{order.id}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 font-medium tracking-wider">
                        {new Date(order.createdAt).toLocaleDateString("en-GB")}
                      </div>
                    </td>

                    {/* Customer Details */}
                    <td className="py-6 px-6 align-top">
                      <div className="font-bold text-black dark:text-white text-base">
                        {order.customerName}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        {order.customerPhone}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 max-w-[200px] leading-relaxed">
                        {order.address}
                      </div>
                    </td>

                    {/* Products/Items */}
                    <td className="py-6 px-6 align-top">
                      <div className="flex flex-col gap-4">
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex items-start gap-4">
                            {item.product.images[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-12 h-12 object-cover rounded-md border border-neutral-200 dark:border-neutral-800 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800" />
                            )}
                            <div>
                              <div className="font-bold text-sm text-black dark:text-white">
                                {item.product.name}
                              </div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex gap-2">
                                <span>
                                  Size:{" "}
                                  <strong className="text-black dark:text-white">
                                    {item.size}
                                  </strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Qty:{" "}
                                  <strong className="text-black dark:text-white">
                                    {item.quantity}
                                  </strong>
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-6 px-6 align-top">
                      <div className="text-2xl font-black text-black dark:text-white tracking-tight">
                        {order.totalAmount}{" "}
                        <span className="text-sm text-neutral-400 font-medium uppercase">
                          EGP
                        </span>
                      </div>
                      <div className="inline-block mt-3 px-2.5 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                        {order.paymentMethod}
                      </div>
                    </td>

                    {/* Status Management */}
                    <td className="py-6 px-6 align-top">
                      <div className="relative max-w-[180px]">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(
                              order.id,
                              e.target.value as OrderStatus
                            )
                          }
                          disabled={updatingId === order.id}
                          className={`w-full appearance-none bg-white dark:bg-black border border-neutral-300 dark:border-neutral-700 text-black dark:text-white text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-lg outline-none focus:border-black dark:focus:border-white transition-all shadow-sm ${
                            updatingId === order.id
                              ? "opacity-50 cursor-wait"
                              : "cursor-pointer"
                          }`}
                        >
                          <option value="PENDING">PENDING</option>
                          {/* تم إضافة حالة AWAITING_PAYMENT هنا أيضاً لتطابق الـ Schema */}
                          <option value="AWAITING_PAYMENT">
                            AWAITING PAYMENT
                          </option>
                          <option value="PAID">PAID</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                          <svg
                            className="w-3 h-3 text-neutral-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            ></path>
                          </svg>
                        </div>
                      </div>
                      {updatingId === order.id && (
                        <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mt-2 text-right pr-2">
                          Updating...
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
