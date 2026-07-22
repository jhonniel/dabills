import { z } from "zod";

export const billingFrequencySchema = z.enum([
  "weekly",
  "monthly",
  "quarterly",
  "semi_annual",
  "yearly",
  "custom",
]);

export const subscriptionStatusSchema = z.enum([
  "active",
  "paused",
  "cancelled",
]);

export const subscriptionSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    categoryId: z.string().uuid().nullable().optional(),
    logoUrl: z.string().trim().optional(),
    amount: z.number().min(0, "Amount must be 0 or greater"),
    currency: z.string().trim().min(3).max(3),
    billingFrequency: billingFrequencySchema,
    customIntervalDays: z.number().int().positive().nullable().optional(),
    startDate: z.string().min(1, "Start date is required"),
    renewalDate: z.string().min(1, "Renewal date is required"),
    autoRenewal: z.boolean(),
    reminderDays: z.array(z.number().int().min(0).max(90)),
    status: subscriptionStatusSchema,
    notes: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.logoUrl && !/^https?:\/\//i.test(data.logoUrl)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid URL",
        path: ["logoUrl"],
      });
    }
    if (data.billingFrequency === "custom" && !data.customIntervalDays) {
      ctx.addIssue({
        code: "custom",
        message: "Custom interval days are required",
        path: ["customIntervalDays"],
      });
    }
  });

export const subscriptionFiltersSchema = z.object({
  search: z.string().optional(),
  status: subscriptionStatusSchema.or(z.literal("all")).optional(),
  categoryId: z.string().optional(),
  sort: z
    .enum([
      "name_asc",
      "name_desc",
      "amount_asc",
      "amount_desc",
      "renewal_asc",
      "renewal_desc",
      "created_desc",
    ])
    .optional(),
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
export type SubscriptionFilters = z.infer<typeof subscriptionFiltersSchema>;
