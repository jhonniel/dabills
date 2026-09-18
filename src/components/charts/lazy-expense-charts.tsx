"use client";

import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ChartSkeleton({ title, hint }: { title: string; hint: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 animate-pulse rounded-xl bg-white/[0.04]" />
      </CardContent>
    </Card>
  );
}

export const MonthlyExpenseChart = dynamic(
  () =>
    import("@/components/charts/expense-charts").then(
      (m) => m.MonthlyExpenseChart
    ),
  {
    ssr: false,
    loading: () => (
      <ChartSkeleton
        title="Monthly expenses"
        hint="Normalized recurring spend over the last 6 months"
      />
    ),
  }
);

export const CategoryBreakdownChart = dynamic(
  () =>
    import("@/components/charts/expense-charts").then(
      (m) => m.CategoryBreakdownChart
    ),
  {
    ssr: false,
    loading: () => (
      <ChartSkeleton
        title="Category breakdown"
        hint="Where your subscription money goes"
      />
    ),
  }
);

export const SalesExpensesChart = dynamic(
  () =>
    import("@/components/charts/expense-charts").then(
      (m) => m.SalesExpensesChart
    ),
  {
    ssr: false,
    loading: () => (
      <ChartSkeleton
        title="Sales & expenses"
        hint="Approved payment volume vs platform costs · last 6 months"
      />
    ),
  }
);
