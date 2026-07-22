import { z } from "zod";

export const inviteCodeSchema = z.object({
  code: z.string().trim().min(6).max(64),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const validateInviteSchema = z.object({
  code: z.string().trim().min(6).max(64),
});

export type InviteCodeInput = z.infer<typeof inviteCodeSchema>;
export type ValidateInviteInput = z.infer<typeof validateInviteSchema>;
