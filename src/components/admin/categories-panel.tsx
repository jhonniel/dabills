"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  adminCreateCategoryAction,
  adminUpdateCategoryAction,
} from "@/features/admin/actions";
import type { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AdminCategoriesPanel({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [color, setColor] = useState("#94A3B8");

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="font-display text-lg">Add category</CardTitle>
          <CardDescription>
            Manage taxonomy used across subscriptions and analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/\s+/g, "_"))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              disabled={pending}
              className="rounded-xl"
              onClick={() => {
                startTransition(async () => {
                  const result = await adminCreateCategoryAction({
                    name,
                    slug,
                    color,
                  });
                  if (!result.success) {
                    toast.error(result.error);
                    return;
                  }
                  toast.success("Category created");
                  setName("");
                  setSlug("");
                  router.refresh();
                });
              }}
            >
              Create category
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            pending={pending}
            onSave={(next) => {
              startTransition(async () => {
                const result = await adminUpdateCategoryAction(next);
                if (!result.success) {
                  toast.error(result.error);
                  return;
                }
                toast.success("Category updated");
                router.refresh();
              });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  pending,
  onSave,
}: {
  category: Category;
  pending: boolean;
  onSave: (input: { id: string; name: string; color: string }) => void;
}) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color ?? "#94A3B8");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="size-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <p className="text-xs text-muted-foreground">{category.slug}</p>
      </div>
      <div className="space-y-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          disabled={pending}
          onClick={() => onSave({ id: category.id, name, color })}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
