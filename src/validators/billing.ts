import { z } from "zod";

export const billStatusSchema = z.enum([
  "upcoming",
  "pending",
  "overdue",
  "pending_verification",
  "paid",
  "failed",
]);

export const billingFiltersSchema = z.object({
  search: z.string().optional(),
  status: billStatusSchema.or(z.literal("all")).optional(),
  view: z.enum(["table", "cards", "calendar", "timeline"]).optional(),
  month: z.string().optional(), // YYYY-MM
});

export type BillingFilters = z.infer<typeof billingFiltersSchema>;
