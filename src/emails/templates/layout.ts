export function emailShell(params: {
  title: string;
  preview?: string;
  bodyHtml: string;
}) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${params.title}</title>
  </head>
  <body style="margin:0;padding:0;background:#070b12;color:#e8eef7;font-family:ui-sans-serif,Segoe UI,Helvetica,Arial,sans-serif;">
    ${params.preview ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${params.preview}</div>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1420;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 8px;">
                <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;">DaBills</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px;">
                ${params.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;color:#6b7787;font-size:12px;line-height:1.5;">
                You’re receiving this because notification emails are enabled on your DaBills account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function ctaButton(href: string, label: string) {
  return `<p style="margin:28px 0 0;">
    <a href="${href}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:linear-gradient(90deg,#22d3ee,#14b8a6);color:#041016;text-decoration:none;font-weight:700;">
      ${label}
    </a>
  </p>`;
}
