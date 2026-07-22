"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { Category } from "@/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SubscriptionFiltersBar({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("search") ?? "");

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/dashboard/subscriptions?${next.toString()}`);
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
    <div className="grid gap-3 md:grid-cols-4">
      <Input
        placeholder="Search subscriptions..."
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
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="paused">Paused</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={params.get("categoryId") ?? "all"}
        onValueChange={(value) => update("categoryId", value ?? "all")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={params.get("sort") ?? "created_desc"}
        onValueChange={(value) => update("sort", value ?? "created_desc")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_desc">Newest</SelectItem>
          <SelectItem value="name_asc">Name A–Z</SelectItem>
          <SelectItem value="name_desc">Name Z–A</SelectItem>
          <SelectItem value="amount_desc">Amount high–low</SelectItem>
          <SelectItem value="amount_asc">Amount low–high</SelectItem>
          <SelectItem value="renewal_asc">Renewal soonest</SelectItem>
          <SelectItem value="renewal_desc">Renewal latest</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
