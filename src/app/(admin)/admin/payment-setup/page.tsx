import { listAllPaymentMethods } from "@/features/payments/payment-methods";
import { AdminPaymentSetupPanel } from "@/components/admin/payment-setup-panel";

export default async function AdminPaymentSetupPage() {
  const { items } = await listAllPaymentMethods();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Payment setup
        </h1>
        <p className="mt-2 text-muted-foreground">
          Configure where users send payments. Matching amount and date on the
          receipt auto-approves the bill.
        </p>
      </div>

      <AdminPaymentSetupPanel methods={items} />
    </div>
  );
}
