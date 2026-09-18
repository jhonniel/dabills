import { toMonthlyAmount } from "@/lib/billing/expenses";
import type { AdminExpense, Payment } from "@/types";

export type FinanceMonthPoint = {
  month: string;
  sales: number;
  expenses: number;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildEmptySeries(months: number) {
  const now = new Date();
  const series: Array<{
    key: string;
    month: string;
    sales: number;
    expenses: number;
  }> = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    series.push({
      key: monthKey(date),
      month: monthLabel(date),
      sales: 0,
      expenses: 0,
    });
  }

  return series;
}

/** Approved payment volume bucketed by paid_at (fallback: created_at). */
export function buildMonthlySalesSeries(
  payments: Array<Pick<Payment, "amount" | "status" | "paid_at" | "created_at">>,
  months = 6
): FinanceMonthPoint[] {
  const series = buildEmptySeries(months);
  const index = new Map(series.map((point, i) => [point.key, i]));

  for (const payment of payments) {
    if (payment.status !== "approved") continue;
    const date = parseDate(payment.paid_at) ?? parseDate(payment.created_at);
    if (!date) continue;
    const key = monthKey(date);
    const at = index.get(key);
    if (at === undefined) continue;
    series[at].sales += Number(payment.amount) || 0;
  }

  return series.map(({ month, sales, expenses }) => ({
    month,
    sales: Number(sales.toFixed(2)),
    expenses: Number(expenses.toFixed(2)),
  }));
}

/**
 * Platform ops costs by month.
 * One-time → expense_date month. Recurring → monthly equivalent for each month
 * on/after expense_date while status is active (archived still counted historically
 * if expense_date falls in range).
 */
export function buildMonthlyAdminExpenseSeries(
  expenses: Array<
    Pick<
      AdminExpense,
      | "amount"
      | "status"
      | "is_recurring"
      | "billing_frequency"
      | "custom_interval_days"
      | "expense_date"
    >
  >,
  months = 6
): FinanceMonthPoint[] {
  const series = buildEmptySeries(months);

  for (let i = 0; i < series.length; i += 1) {
    const [year, month] = series[i].key.split("-").map(Number);
    const monthEnd = new Date(year, month, 0);

    for (const expense of expenses) {
      const start = parseDate(expense.expense_date);
      if (!start) continue;

      if (!expense.is_recurring) {
        if (start.getFullYear() === year && start.getMonth() === month - 1) {
          series[i].expenses += Number(expense.amount) || 0;
        }
        continue;
      }

      if (!expense.billing_frequency) continue;
      if (start > monthEnd) continue;
      if (expense.status !== "active") continue;

      series[i].expenses += toMonthlyAmount(
        Number(expense.amount) || 0,
        expense.billing_frequency,
        expense.custom_interval_days
      );
    }
  }

  return series.map(({ month, sales, expenses }) => ({
    month,
    sales: Number(sales.toFixed(2)),
    expenses: Number(expenses.toFixed(2)),
  }));
}

export function mergeFinanceSeries(
  sales: FinanceMonthPoint[],
  expenses: FinanceMonthPoint[]
): FinanceMonthPoint[] {
  const byMonth = new Map<string, FinanceMonthPoint>();

  for (const point of sales) {
    byMonth.set(point.month, {
      month: point.month,
      sales: point.sales,
      expenses: 0,
    });
  }

  for (const point of expenses) {
    const current = byMonth.get(point.month) ?? {
      month: point.month,
      sales: 0,
      expenses: 0,
    };
    current.expenses = point.expenses;
    byMonth.set(point.month, current);
  }

  // Preserve sales series order (already chronological).
  return sales.map((point) => byMonth.get(point.month) ?? point);
}

export function sumSalesInCurrentMonth(
  payments: Array<Pick<Payment, "amount" | "status" | "paid_at" | "created_at">>
) {
  const now = new Date();
  const key = monthKey(now);
  return payments.reduce((sum, payment) => {
    if (payment.status !== "approved") return sum;
    const date = parseDate(payment.paid_at) ?? parseDate(payment.created_at);
    if (!date || monthKey(date) !== key) return sum;
    return sum + (Number(payment.amount) || 0);
  }, 0);
}

export function sumExpensesInCurrentMonth(
  expenses: Array<
    Pick<
      AdminExpense,
      | "amount"
      | "status"
      | "is_recurring"
      | "billing_frequency"
      | "custom_interval_days"
      | "expense_date"
    >
  >
) {
  const series = buildMonthlyAdminExpenseSeries(expenses, 1);
  return series[series.length - 1]?.expenses ?? 0;
}
