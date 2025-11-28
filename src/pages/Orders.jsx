import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

const Orders = () => {
  const { currency, userOrders, getPriceBySize } = useContext(ShopContext);

  const normalizeOrderItems = (items) => {
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

  return (
    <div className="py-10 text-black dark:text-white">
      <div className="text-2xl">
        <Title text1={"Your"} text2={"Orders"} />
      </div>

      {userOrders.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-20">
          No orders yet.
        </div>
      ) : (
        <div className="flex flex-col gap-6 mt-6">
          {userOrders.map((order) => {
            const items = normalizeOrderItems(order.items, getPriceBySize);

            return (
              <div
                key={order.id}
                className="border border-gray-300 dark:border-gray-700 rounded-xl p-6 shadow-sm dark:shadow-none bg-white dark:bg-gray-900"
              >
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {order.date}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "Delivered"
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400"
                        : order.status === "Shipped"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-400"
                        : order.status === "Processing"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-3">
                  {items.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No items
                    </div>
                  ) : (
                    items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-3"
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                            No image
                          </div>
                        )}

                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Size: {item.size}
                          </p>
                          <p className="text-sm">Qty: {item.quantity}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-gold-base">
                            {currency}
                            {Number(item.price).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ({currency}
                            {(
                              Number(item.price) * Number(item.quantity)
                            ).toFixed(2)}
                            )
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Payment: {order.payment}
                  </p>
                  <p className="font-bold text-lg">
                    Total: {currency}
                    {Number(order.total || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
