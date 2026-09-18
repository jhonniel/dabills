import { z } from "zod";

export const paymentMethodSchema = z.object({
  channel: z.string().trim().min(2, "Channel is required").max(80),
  accountName: z.string().trim().min(2, "Account name is required").max(120),
  accountNumber: z
    .string()
    .trim()
    .min(3, "Account number is required")
    .max(120),
  instructions: z.string().trim().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
});

export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;
