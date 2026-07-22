export function inviteEmailHtml(params: {
  inviteCode: string;
  inviteUrl: string;
  recipientName?: string;
}) {
  const name = params.recipientName ?? "there";
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#070b12;color:#e8eef7;font-family:Inter,Segoe UI,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#0d1420;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px;">
            <tr>
              <td>
                <div style="font-size:22px;font-weight:700;letter-spacing:-0.02em;">DaBills</div>
                <p style="margin:24px 0 8px;font-size:18px;font-weight:600;">You're invited, ${name}.</p>
                <p style="margin:0 0 24px;color:#9aa7b8;line-height:1.6;">
                  Use this invite code to create your DaBills account and start managing every subscription in one place.
                </p>
                <div style="display:inline-block;padding:12px 18px;border-radius:12px;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.3);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:16px;letter-spacing:0.08em;color:#67e8f9;">
                  ${params.inviteCode}
                </div>
                <p style="margin:28px 0 0;">
                  <a href="${params.inviteUrl}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:linear-gradient(90deg,#22d3ee,#14b8a6);color:#041016;text-decoration:none;font-weight:700;">
                    Accept invite
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
