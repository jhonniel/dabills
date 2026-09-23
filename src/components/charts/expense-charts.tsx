"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PieChart as PieIcon, TrendingUp } from "lucide-react";

import { formatMoney } from "@/lib/billing/expenses";
import type { FinanceMonthPoint } from "@/lib/admin/finance-series";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c121c]/80">
      <div className="border-b border-white/[0.06] px-4 py-4 sm:px-5">
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
      </div>
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function MonthlyExpenseChart({
  data,
}: {
  data: Array<{ month: string; total: number }>;
}) {
  const hasSpend = data.some((d) => d.total > 0);

  return (
    <Panel
      title="Monthly expenses"
      description="Normalized recurring spend over the last 6 months"
    >
      {!hasSpend ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            <TrendingUp className="size-5 text-cyan-300/80" />
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-200">No spend data yet</p>
          <p className="mt-1 max-w-[240px] text-xs text-zinc-500">
            Charts populate once active subscriptions are assigned to your account.
          </p>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat("en-PH", {
                    notation: "compact",
                    compactDisplay: "short",
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 0,
                  }).format(Number(v))
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#0c121c",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
                formatter={(value) => [formatMoney(Number(value ?? 0)), "Spend"]}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#expenseFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function SalesExpensesChart({
  data,
}: {
  data: FinanceMonthPoint[];
}) {
  const hasData = data.some((d) => d.sales > 0 || d.expenses > 0);

  return (
    <Panel
      title="Sales & expenses"
      description="Approved payment volume vs platform costs · last 6 months"
    >
      {!hasData ? (
        <div className="flex h-72 flex-col items-center justify-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            <TrendingUp className="size-5 text-teal-300/80" />
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-200">
            No finance data yet
          </p>
          <p className="mt-1 max-w-[260px] text-xs text-zinc-500">
            Sales appear when payments are approved. Expenses come from Admin →
            Expenses.
          </p>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="opsExpenseFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#71717a", fontSize: 11 }}
                tickFormatter={(v) =>
                  new Intl.NumberFormat("en-PH", {
                    notation: "compact",
                    compactDisplay: "short",
                    style: "currency",
                    currency: "PHP",
                    maximumFractionDigits: 0,
                  }).format(Number(v))
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#0c121c",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 12,
                }}
                formatter={(value, name) => [
                  formatMoney(Number(value ?? 0)),
                  name === "sales" ? "Sales" : "Expenses",
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 12, color: "#a1a1aa" }}
                formatter={(value) =>
                  value === "sales" ? "Sales" : "Expenses"
                }
              />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#2dd4bf"
                strokeWidth={2}
                fill="url(#salesFill)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#fb7185"
                strokeWidth={2}
                fill="url(#opsExpenseFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function CategoryBreakdownChart({
  data,
}: {
  data: Array<{ name: string; color: string; monthly: number }>;
}) {
  const chartData = data.map((item) => ({
    name: item.name,
    value: Number(item.monthly.toFixed(2)),
    color: item.color,
  }));

  return (
    <Panel
      title="Category breakdown"
      description="Active monthly spend by category"
    >
      {chartData.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center text-center">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
            <PieIcon className="size-5 text-cyan-300/80" />
          </div>
          <p className="mt-3 text-sm font-medium text-zinc-200">No categories yet</p>
          <p className="mt-1 max-w-[220px] text-xs text-zinc-500">
            Category mix appears after you have active subscriptions.
          </p>
        </div>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0c121c",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                  }}
                  formatter={(value) => [
                    formatMoney(Number(value ?? 0)),
                    "Monthly",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-2">
            {chartData.map((item) => (
              <li
                key={item.name}
                className="flex items-center justify-between text-sm text-zinc-400"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.name}
                </span>
                <span className="tabular-nums text-zinc-200">
                  {formatMoney(item.value)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
