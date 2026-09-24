import { z } from "zod";

function optionalEmailField() {
  return z
    .string()
    .trim()
    .optional()
    .default("")
    .superRefine((value, ctx) => {
      if (!value) return;
      if (!z.string().email().safeParse(value).success) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid email address",
        });
      }
    });
}

export const adminCreateUserSchema = z
  .object({
    email: optionalEmailField(),
    fullName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    sendActivation: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.sendActivation && !data.email?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email is required when sending a claim link",
      });
    }
  });

export const adminSendActivationSchema = z.object({
  userId: z.string().min(1),
  sendEmail: z.boolean().optional().default(true),
  email: optionalEmailField(),
});

export const activateAccountSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[a-z]/, "Include at least one lowercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type ActivateAccountInput = z.infer<typeof activateAccountSchema>;
