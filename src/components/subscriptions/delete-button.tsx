"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteSubscriptionAction } from "@/features/subscriptions/actions";
import { Button } from "@/components/ui/button";

export function DeleteSubscriptionButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      className="rounded-xl border-rose-400/30 text-rose-300 hover:bg-rose-400/10"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this subscription?")) return;
        startTransition(async () => {
          const result = await deleteSubscriptionAction(id);
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Subscription deleted");
          router.push("/dashboard/subscriptions");
          router.refresh();
        });
      }}
    >
      <Trash2 className="size-4" />
      {pending ? "Deleting..." : "Delete"}
    </Button>
  );
}
