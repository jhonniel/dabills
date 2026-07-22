import { Resend } from "resend";

import type { EmailLog } from "@/types";

let resendClient: Resend | null = null;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  template: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function sendEmail(
  input: SendEmailInput
): Promise<{ id?: string; log: Partial<EmailLog> }> {
  const from =
    process.env.RESEND_FROM_EMAIL ?? "DaBills <noreply@dabills.app>";

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    return {
      id: result.data?.id,
      log: {
        user_id: input.userId ?? null,
        to_email: input.to,
        subject: input.subject,
        template: input.template,
        status: "sent",
        provider_id: result.data?.id ?? null,
        metadata: input.metadata ?? null,
      },
    };
  } catch (error) {
    return {
      log: {
        user_id: input.userId ?? null,
        to_email: input.to,
        subject: input.subject,
        template: input.template,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown email error",
        metadata: input.metadata ?? null,
      },
    };
  }
}
