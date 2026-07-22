import { z } from "zod";

export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  reminder5d: z.boolean(),
  reminder3d: z.boolean(),
  reminder1d: z.boolean(),
  dueToday: z.boolean(),
  overdue: z.boolean(),
  paymentEvents: z.boolean(),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  inAppEnabled: true,
  reminder5d: true,
  reminder3d: true,
  reminder1d: true,
  dueToday: true,
  overdue: true,
  paymentEvents: true,
};
