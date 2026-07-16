"use server";

import { prisma } from "../prisma";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * All registered users with per-user order count and lifetime spend, for the
 * admin Customers table.
 *
 * Gated by `requireAdmin()` so the guard travels with the data and cannot be
 * bypassed by the page rendering before its parent layout resolves. Decimal
 * `totalAmount` values are reduced to a plain `number` here so the returned
 * shape is JSON-safe.
 */
export async function getAdminUsers() {
  await requireAdmin();

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
