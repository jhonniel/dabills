import { escapeHtml } from "@/lib/security/request";

import { ctaButton, emailShell } from "./layout";

const copy: Record<
  string,
  { title: string; message: (name: string, due: string) => string }
> = {
  reminder_5d: {
    title: "Payment due in 5 days",
    message: (name, due) =>
      `${name} renews on ${due}. Review the amount and make sure you’re ready.`,
  },
  reminder_3d: {
    title: "Payment due in 3 days",
    message: (name, due) =>
      `${name} is due on ${due}. A quick check now avoids surprises later.`,
  },
  reminder_1d: {
    title: "Payment due tomorrow",
    message: (name, due) =>
      `${name} is due tomorrow (${due}). Settle it when you’re ready.`,
  },
  due_today: {
    title: "Payment due today",
    message: (name, due) =>
      `${name} is due today (${due}). Open DaBills to settle this bill.`,
  },
  overdue: {
    title: "Payment overdue",
    message: (name, due) =>
      `${name} was due on ${due} and is now overdue. Settle it as soon as you can.`,
  },
};

export function reminderEmailHtml(params: {
  type: keyof typeof copy;
  subscriptionName: string;
  dueDate: string;
  amountLabel: string;
  billingUrl: string;
}) {
  const content = copy[params.type] ?? copy.due_today;
  const name = escapeHtml(params.subscriptionName);
  const due = escapeHtml(params.dueDate);
  const amount = escapeHtml(params.amountLabel);

  return emailShell({
    title: content.title,
    preview: `${params.subscriptionName} · ${params.amountLabel}`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:18px;font-weight:600;">${content.title}</p>
      <p style="margin:0 0 18px;color:#9aa7b8;line-height:1.6;">
        ${content.message(name, due)}
      </p>
      <div style="padding:14px 16px;border-radius:14px;background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.2);">
        <div style="font-size:13px;color:#9aa7b8;">Amount</div>
        <div style="margin-top:4px;font-size:22px;font-weight:700;letter-spacing:-0.02em;">${amount}</div>
      </div>
      ${ctaButton(params.billingUrl, "Review bill")}
    `,
  });
}
