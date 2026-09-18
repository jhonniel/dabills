import { z } from "zod";

import { billingFrequencySchema } from "@/validators/subscription";

export const subscriptionPlanStatusSchema = z.enum(["active", "archived"]);

export const subscriptionPlanSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    categoryId: z.string().min(1).nullable().optional(),
    logoUrl: z.string().trim().optional(),
    amount: z.number().min(0, "Amount must be 0 or greater"),
    currency: z.string().trim().min(3).max(3),
    billingFrequency: billingFrequencySchema,
    customIntervalDays: z.number().int().positive().nullable().optional(),
    maxCapacity: z
      .number()
      .int("Capacity must be a whole number")
      .min(1, "Capacity must be at least 1")
      .max(10_000, "Capacity is too large"),
    status: subscriptionPlanStatusSchema.optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.logoUrl &&
      !/^https?:\/\//i.test(data.logoUrl) &&
      !data.logoUrl.startsWith("/")
    ) {
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

export type SubscriptionPlanInput = z.infer<typeof subscriptionPlanSchema>;
