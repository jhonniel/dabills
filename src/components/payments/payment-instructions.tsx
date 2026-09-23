import type { PaymentMethod } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PaymentInstructions({
  methods,
}: {
  methods: PaymentMethod[];
}) {
  if (methods.length === 0) {
    return (
      <Card className="border-amber-400/20 bg-amber-400/5">
        <CardHeader>
          <CardTitle className="font-display text-lg">Send payment to</CardTitle>
          <CardDescription>
            No payment destinations are configured yet. Ask an admin to add
            GCash, Maya, or bank details under Payment setup.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="font-display text-lg">Send payment to</CardTitle>
        <CardDescription>
          Pay the exact bill amount, then upload your transfer receipt. Matching
          amount and reference auto-confirm the payment.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {methods.map((method) => (
          <div
            key={method.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <div className="flex flex-wrap items-start gap-4">
              {method.qr_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={method.qr_image_url}
                  alt={`${method.channel} QR code`}
                  className="size-28 shrink-0 rounded-lg border border-white/10 bg-white object-contain p-1.5"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-cyan-200">
                  {method.channel}
                </p>
                <p className="mt-1 break-words text-sm text-white">
                  {method.account_name}
                </p>
                <p className="break-all font-mono text-sm text-zinc-300">
                  {method.account_number}
                </p>
                {method.instructions && (
                  <p className="mt-2 break-words text-xs text-muted-foreground">
                    {method.instructions}
                  </p>
                )}
                {method.qr_image_url && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Scan the QR or send to the account above.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
