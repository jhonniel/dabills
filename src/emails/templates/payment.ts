import { ctaButton, emailShell } from "./layout";

export function paymentReceivedEmailHtml(params: {
  subscriptionName: string;
  amountLabel: string;
  reference?: string | null;
  paymentsUrl: string;
}) {
  return emailShell({
    title: "Payment received",
    preview: `We received your receipt for ${params.subscriptionName}`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:18px;font-weight:600;">Payment received</p>
      <p style="margin:0 0 18px;color:#9aa7b8;line-height:1.6;">
        Your receipt for <strong style="color:#e8eef7;">${params.subscriptionName}</strong>
        (${params.amountLabel}) was uploaded and is pending verification.
      </p>
      ${
        params.reference
          ? `<p style="margin:0 0 18px;color:#9aa7b8;">Reference: <span style="color:#67e8f9;">${params.reference}</span></p>`
          : ""
      }
      ${ctaButton(params.paymentsUrl, "View payment history")}
    `,
  });
}

export function paymentApprovedEmailHtml(params: {
  subscriptionName: string;
  amountLabel: string;
  paymentsUrl: string;
}) {
  return emailShell({
    title: "Payment approved",
    preview: `${params.subscriptionName} marked as paid`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:18px;font-weight:600;">Payment approved</p>
      <p style="margin:0 0 18px;color:#9aa7b8;line-height:1.6;">
        Your payment for <strong style="color:#e8eef7;">${params.subscriptionName}</strong>
        (${params.amountLabel}) has been approved and the bill is marked paid.
      </p>
      ${ctaButton(params.paymentsUrl, "Open payments")}
    `,
  });
}

export function subscriptionRenewedEmailHtml(params: {
  subscriptionName: string;
  nextBillingDate: string;
  amountLabel: string;
  subscriptionUrl: string;
}) {
  return emailShell({
    title: "Subscription renewed",
    preview: `${params.subscriptionName} renews ${params.nextBillingDate}`,
    bodyHtml: `
      <p style="margin:0 0 8px;font-size:18px;font-weight:600;">Subscription renewed</p>
      <p style="margin:0 0 18px;color:#9aa7b8;line-height:1.6;">
        A new billing cycle was generated for <strong style="color:#e8eef7;">${params.subscriptionName}</strong>.
        Next due date: ${params.nextBillingDate} · ${params.amountLabel}.
      </p>
      ${ctaButton(params.subscriptionUrl, "View subscription")}
    `,
  });
}
