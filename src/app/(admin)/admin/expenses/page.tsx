import { AdminExpensesPanel } from "@/components/admin/expenses-panel";
import { listAdminExpenses } from "@/features/admin/queries";
import { listCategories } from "@/features/categories/queries";
import { isExpenseUuid } from "@/lib/expenses/expenses-store";

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const [{ items: expenses }, categories] = await Promise.all([
    listAdminExpenses(),
    listCategories(),
  ]);

  // Drop any stale non-UUID demo seed rows so they can't be edited against Supabase.
  const safeExpenses = expenses.filter((item) => isExpenseUuid(item.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Expenses
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Track platform costs — one-time or recurring, with the next recurrence
          date.
        </p>
      </div>

      <AdminExpensesPanel expenses={safeExpenses} categories={categories} />
    </div>
  );
}
