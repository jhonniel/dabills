import { listAdminCategories } from "@/features/admin/queries";
import { AdminCategoriesPanel } from "@/components/admin/categories-panel";

export default async function AdminCategoriesPage() {
  const { items } = await listAdminCategories();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Categories
        </h1>
        <p className="mt-2 text-muted-foreground">
          Maintain the subscription taxonomy used across the product.
        </p>
      </div>
      <AdminCategoriesPanel categories={items} />
    </div>
  );
}
