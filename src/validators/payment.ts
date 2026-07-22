import { z } from "zod";

export const settleBillSchema = z.object({
  billingCycleId: z.string().min(1),
  referenceNumber: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(1000).optional(),
  forceMismatch: z.boolean().optional(),
});

export const paymentFiltersSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum([
      "all",
      "pending",
      "pending_verification",
      "approved",
      "rejected",
      "failed",
    ])
    .optional(),
});

export type SettleBillInput = z.infer<typeof settleBillSchema>;
export type PaymentFilters = z.infer<typeof paymentFiltersSchema>;
