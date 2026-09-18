"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { CalendarDays, LayoutGrid, List, RefreshCw, Sparkles, Waypoints } from "lucide-react";

import {
  generateUpcomingBillsAction,
  refreshBillStatusesAction,
} from "@/features/billing/actions";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const views = [
  { id: "table", label: "Table", icon: List },
  { id: "cards", label: "Cards", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "timeline", label: "Timeline", icon: Waypoints },
] as const;

export function BillingToolbar({
  monthOptions,
}: {
  categories?: Category[];
  monthOptions: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [pending, startTransition] = useTransition();
  const view = params.get("view") ?? "table";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/dashboard/billing?${next.toString()}`);
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = params.get("search") ?? "";
      if (search !== current) update("search", search);
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {views.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={view === item.id ? "default" : "outline"}
                className={cn(
                  "min-h-11 rounded-xl sm:min-h-7",
                  view === item.id &&
                    "bg-cyan-400/20 text-cyan-100 hover:bg-cyan-400/25"
                )}
                onClick={() => update("view", item.id)}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sr-only sm:hidden">{item.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await refreshBillStatusesAction();
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                toast.success(`Refreshed ${result.data?.updated ?? 0} bill statuses`);
                router.refresh();
              });
            }}
          >
            <RefreshCw className="size-4" />
            <span className="sm:hidden">Refresh</span>
            <span className="hidden sm:inline">Refresh statuses</span>
          </Button>
          <Button
            type="button"
            size="sm"
            className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-500 font-semibold text-black"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await generateUpcomingBillsAction({
                  horizonDays: 120,
                  maxCycles: 6,
                });
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  `Generated ${result.data?.created ?? 0} upcoming bills`
                );
                router.refresh();
              });
            }}
          >
            <Sparkles className="size-4" />
            <span className="sm:hidden">Generate</span>
            <span className="hidden sm:inline">Generate bills</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder="Search bills..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          value={params.get("status") ?? "all"}
          onValueChange={(value) => update("status", value ?? "all")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending_verification">Pending verification</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={params.get("month") ?? "all"}
          onValueChange={(value) => update("month", value ?? "all")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All months</SelectItem>
            {monthOptions.map((month) => (
              <SelectItem key={month} value={month}>
                {new Date(`${month}-01T12:00:00`).toLocaleString("en-PH", {
                  month: "long",
                  year: "numeric",
                })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
