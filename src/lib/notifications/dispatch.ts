import { getAppUrl, isSupabaseConfigured } from "@/lib/env";
import {
  appendDemoEmailLog,
  createDemoNotification,
  readDemoNotificationPreferences,
} from "@/lib/notifications/demo-store";
import { sendEmail } from "@/services/email/client";
import type { NotificationType } from "@/types";
import type { NotificationPreferences } from "@/validators/notification";

export type NotifyInput = {
  userId: string;
  email?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href?: string | null;
  emailSubject?: string;
  emailHtml?: string;
  emailTemplate?: string;
  metadata?: Record<string, unknown>;
  preferences?: NotificationPreferences;
};

function prefersType(
  prefs: NotificationPreferences,
  type: NotificationType
) {
  switch (type) {
    case "reminder_5d":
      return prefs.reminder5d;
    case "reminder_3d":
      return prefs.reminder3d;
    case "reminder_1d":
      return prefs.reminder1d;
    case "due_today":
      return prefs.dueToday;
    case "overdue":
      return prefs.overdue;
    case "payment_received":
    case "payment_approved":
    case "payment_rejected":
    case "subscription_renewed":
      return prefs.paymentEvents;
    default:
      return true;
  }
}

/**
 * Creates an in-app notification and optionally sends email via Resend.
 * Persists to Supabase when configured; cookie store only in demo mode.
 */
export async function dispatchNotification(input: NotifyInput) {
  const prefs =
    input.preferences ??
    (await readDemoNotificationPreferences(input.userId));

  if (!prefersType(prefs, input.type)) {
    return { inApp: null, email: null, skipped: true as const };
  }

  let inApp = null;
  if (prefs.inAppEnabled) {
    inApp = await createDemoNotification({
      user_id: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: input.metadata ?? null,
    });
  }

  let emailResult = null;
  if (
    prefs.emailEnabled &&
    input.email &&
    input.emailHtml &&
    input.emailSubject &&
    input.emailTemplate
  ) {
    if (process.env.RESEND_API_KEY) {
      const sent = await sendEmail({
        to: input.email,
        subject: input.emailSubject,
        html: input.emailHtml,
        template: input.emailTemplate,
        userId: input.userId,
        metadata: input.metadata,
      });
      emailResult = sent;
      await appendDemoEmailLog({
        user_id: input.userId,
        to_email: input.email,
        subject: input.emailSubject,
        template: input.emailTemplate,
        status: sent.log.status ?? "failed",
        provider_id: sent.log.provider_id ?? null,
        error: sent.log.error ?? null,
        metadata: input.metadata ?? null,
      });
    } else {
      emailResult = {
        id: `mock_${Date.now()}`,
        log: {
          user_id: input.userId,
          to_email: input.email,
          subject: input.emailSubject,
          template: input.emailTemplate,
          status: "sent" as const,
          provider_id: `mock_${Date.now()}`,
          error: null,
          metadata: {
            ...(input.metadata ?? {}),
            mock: true,
            note: "RESEND_API_KEY not configured — logged locally",
          },
        },
      };
      await appendDemoEmailLog({
        user_id: input.userId,
        to_email: input.email,
        subject: input.emailSubject,
        template: input.emailTemplate,
        status: "sent",
        provider_id: emailResult.id,
        error: null,
        metadata: emailResult.log.metadata ?? null,
      });
    }
  }

  return {
    inApp,
    email: emailResult,
    skipped: false as const,
    appUrl: getAppUrl(),
    isDemo: !isSupabaseConfigured(),
  };
}
