import React from "react";
import { prisma } from "../../../../lib/prisma";
import {
  User,
  Mail,
  Calendar,
  ShoppingBag,
  DollarSign,
  Shield,
} from "lucide-react";

// دالة لجلب المستخدمين مع بيانات طلباتهم
async function getUsersData() {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      orders: {
        select: {
          totalAmount: true,
        },
      },
    },
  });

  // معالجة البيانات لحساب عدد الطلبات وإجمالي المدفوعات لكل مستخدم
  return users.map((user) => {
    const totalOrders = user.orders.length;
    const totalSpent = user.orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    return {
      ...user,
      totalOrders,
      totalSpent,
    };
  });
}

export default async function AdminUsersPage() {
  const users = await getUsersData();

  return (
    <div className="flex-1 space-y-2 p-2 pt-1 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white prata-regular tracking-wide">
            Customers
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Manage your registered users and track their purchase history.
          </p>
        </div>
        <div className="bg-gold-base/10 text-gold-base px-4 py-2 rounded-lg font-medium">
          Total Users: {users.length}
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-sm text-gray-600 dark:text-gray-300">
                <th className="p-4 font-semibold">User Info</th>
                <th className="p-4 font-semibold text-center">Role</th>
                <th className="p-4 font-semibold text-center">Joined Date</th>
                <th className="p-4 font-semibold text-center">Orders</th>
                <th className="p-4 font-semibold text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800 text-sm">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  {/* User Info */}
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-base/20 flex items-center justify-center text-gold-base shrink-0">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {user.name}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="p-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {user.role === "ADMIN" ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <User className="w-3 h-3" />
                      )}
                      {user.role}
                    </span>
                  </td>

                  {/* Joined Date */}
                  <td className="p-4 text-center text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>

                  {/* Orders Count */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 font-medium text-gray-900 dark:text-gray-300">
                      <ShoppingBag className="w-4 h-4 text-gray-400" />
                      {user.totalOrders}
                    </div>
                  </td>

                  {/* Total Spent */}
                  <td className="p-4 text-right font-semibold text-gold-base">
                    <div className="flex items-center justify-end gap-1">
                      {user.totalSpent.toFixed(2)} EGP
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No users found in the system.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
