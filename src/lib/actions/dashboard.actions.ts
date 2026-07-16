"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-guards";

/**
 * KPI + 6-month revenue data for the admin dashboard.
 *
 * The query lives here (next to the data) and is gated by `requireAdmin()`
 * so the authorization check is impossible to skip — the page never touches
 * Prisma directly and cannot render even partially without passing the guard.
 * Decimal money values are serialized to plain numbers at this boundary so
 * client components (e.g. the revenue chart) receive JSON-safe data.
 */
export async function getDashboardStats() {
  await requireAdmin();

  const [totalRevenue, ordersCount, usersCount, pendingOrdersCount] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: { in: ["SHIPPED", "DELIVERED"] },
        },
      }),
      prisma.order.count({
        where: {
          NOT: { status: "CANCELLED" },
        },
      }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
    ]);

  const rawOrders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      },
      status: { in: ["SHIPPED", "DELIVERED"] },
    },
    select: { totalAmount: true, createdAt: true },
  });

  // Serialize Decimal -> number before handing data to a client component.
  const chartOrders = rawOrders.map((o) => ({
    totalAmount: Number(o.totalAmount),
    createdAt: o.createdAt,
  }));

  return {
    totalRevenue: Number(totalRevenue._sum.totalAmount ?? 0),
    ordersCount,
    usersCount,
    pendingOrdersCount,
    chartOrders,
  };
}
