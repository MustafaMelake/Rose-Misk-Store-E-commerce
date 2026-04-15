"use client";

import { useMemo } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  Bar,
  ComposedChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface RevenueChartProps {
  orders: {
    totalAmount: number;
    createdAt: Date;
  }[];
}

export function RevenueChart({ orders }: RevenueChartProps) {
  // 1. معالجة البيانات: حساب مبيعات آخر 6 شهور بدقة
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();

    // إنشاء هيكل لآخر 6 شهور (حتى لو مفيش فيهم مبيعات يظهروا بـ 0)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString("default", { month: "short" }),
        fullMonth: d.toLocaleString("default", { month: "long" }),
        year: d.getFullYear(),
        revenue: 0,
        orderCount: 0,
      });
    }

    // توزيع الأوردرات على الشهور
    orders.forEach((order) => {
      const date = new Date(order.createdAt);
      const monthName = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();

      const monthEntry = months.find(
        (m) => m.name === monthName && m.year === year
      );

      if (monthEntry) {
        monthEntry.revenue += order.totalAmount;
        monthEntry.orderCount += 1;
      }
    });

    return months;
  }, [orders]);

  // دالة تنسيق العملة
  const formatEGP = (value: number) =>
    new Intl.NumberFormat("en-EG", {
      style: "currency",
      currency: "EGP",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <Card className="col-span-4 shadow-sm border-neutral-200/50 dark:border-neutral-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl">
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              {/* تعريف التدرج الذهبي للفخامة */}
              <defs>
                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e5e5"
                className="dark:stroke-zinc-800"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tick={{ fill: "#71717a" }}
                dy={10}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                fontSize={12}
                tick={{ fill: "#71717a" }}
                tickFormatter={(value) => `${value / 1000}k`}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(212, 175, 55, 0.05)" }}
              />

              {/* عوارض شفافة لعدد الطلبات في الخلفية */}
              <Bar
                dataKey="orderCount"
                fill="#71717a"
                opacity={0.1}
                barSize={30}
                radius={[4, 4, 0, 0]}
              />

              {/* مساحة مبيعات ذهبية انسيابية في المقدمة */}
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#D4AF37"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                activeDot={{
                  r: 6,
                  stroke: "#fff",
                  strokeWidth: 2,
                  fill: "#D4AF37",
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// مكون الـ Tooltip المخصص بتصميم عصري
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const revenue =
      payload.find((p: any) => p.dataKey === "revenue")?.value || 0;
    const count =
      payload.find((p: any) => p.dataKey === "orderCount")?.value || 0;

    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-3 shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {new Intl.NumberFormat("en-EG", {
                  style: "currency",
                  currency: "EGP",
                }).format(revenue)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-zinc-400" />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {count} Orders
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}
