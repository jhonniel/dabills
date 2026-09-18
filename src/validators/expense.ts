import { z } from "zod";

import { billingFrequencySchema } from "@/validators/subscription";

export const adminExpenseStatusSchema = z.enum(["active", "archived"]);

export const adminExpenseSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(120),
    categoryId: z.string().min(1).nullable().optional(),
    amount: z.number().min(0, "Amount must be 0 or greater"),
    currency: z.string().trim().min(3).max(3),
    isRecurring: z.boolean(),
    billingFrequency: billingFrequencySchema.nullable().optional(),
    customIntervalDays: z.number().int().positive().nullable().optional(),
    expenseDate: z.string().min(1, "Expense date is required"),
    nextRecurrenceDate: z.string().nullable().optional(),
    status: adminExpenseStatusSchema.optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.expenseDate)) {
      ctx.addIssue({
        code: "custom",
        message: "Use YYYY-MM-DD for expense date",
        path: ["expenseDate"],
      });
    }

    if (data.isRecurring) {
      if (!data.billingFrequency) {
        ctx.addIssue({
          code: "custom",
          message: "Billing frequency is required for recurring expenses",
          path: ["billingFrequency"],
        });
      }
      if (
        data.billingFrequency === "custom" &&
        !data.customIntervalDays
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Custom interval days are required",
          path: ["customIntervalDays"],
        });
      }
      if (
        data.nextRecurrenceDate &&
        !/^\d{4}-\d{2}-\d{2}$/.test(data.nextRecurrenceDate)
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Use YYYY-MM-DD for next recurrence",
          path: ["nextRecurrenceDate"],
        });
      }
    }
  });

export type AdminExpenseInput = z.infer<typeof adminExpenseSchema>;
