import { prisma } from "../../../lib/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DollarSign, Package, ShoppingCart, Users, Clock } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";

export default async function AdminDashboard() {
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

  return (
    <div className="flex-1 space-y-6 p-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight prata-regular text-gold-600">
            Rose Misk Command Center
          </h2>
          <p className="text-muted-foreground">
            A birds-eye view of your business performance.
          </p>
        </div>
      </div>

      {/* الـ KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={`${Number(totalRevenue._sum.totalAmount ?? 0).toLocaleString()} EGP`}
          icon={<DollarSign className="h-4 w-4 text-gold-500" />}
          description="Confirmed earnings (Shipped & Delivered)"
        />
        <StatsCard
          title="Total Sales"
          value={`+${ordersCount}`}
          icon={<ShoppingCart className="h-4 w-4 text-blue-500" />}
          description="Cumulative order volume (excl. Cancelled)"
        />
        <StatsCard
          title="Customers"
          value={`+${usersCount}`}
          icon={<Users className="h-4 w-4 text-green-500" />}
          description="Active registered users"
        />
        <StatsCard
          title="Pending Fulfillment"
          value={pendingOrdersCount}
          icon={<Clock className="h-4 w-4 text-orange-500" />}
          description="Orders waiting to be processed"
          trend={
            pendingOrdersCount > 0 ? "Requires Attention" : "All caught up"
          }
          trendColor={
            pendingOrdersCount > 0 ? "text-orange-500" : "text-green-500"
          }
        />
      </div>

      {/* الـ Full Width Chart */}
      <div className="grid gap-4 grid-cols-1">
        <Card className="shadow-lg border-gold-100/50 overflow-hidden">
          <CardHeader className="bg-neutral-50/50 dark:bg-zinc-900/50">
            <CardTitle className="text-2xl prata-regular text-zinc-800 dark:text-zinc-100">
              Revenue Analytics & Market Trends
            </CardTitle>
            <CardDescription>
              A detailed 6-month visual breakdown of your financial performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[450px]">
              <RevenueChart orders={chartOrders} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  icon,
  description,
  trend,
  trendColor = "text-red-500",
}: any) {
  return (
    <Card className="hover:border-gold-300 transition-all duration-300 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <span className={`text-xs font-bold ${trendColor} mt-1 block`}>
            {trend}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
