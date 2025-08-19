// src/lib/email.ts
// Minimal email helper using Resend, with a clean HTML template.
// Falls back to console logging in dev if RESEND_API_KEY is not set.

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Your App';
const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com';

let resend: Resend | null = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Generic sender: sends exactly the HTML/text you supply, with your from address.
 * Use this for system notifications, admin alerts, etc.
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const { to, subject, html, text } = opts;

  if (!resend) {
    // Dev fallback (no RESEND_API_KEY): log only
    console.log(
      '[email:dev-fallback] To:',
      to,
      '\nSubject:',
      subject,
      '\nText:\n',
      text ?? '[no-text]',
      '\nHTML:\n',
      html,
    );
    return { id: 'dev-fallback', error: null as null };
  }

  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  if (result.error) {
    console.error('[email] resend error:', result.error);
  }
  return result;
}

function emailLayout(opts: {
  title: string;
  bodyHtml: string;
  preview?: string;
}) {
  const { title, bodyHtml, preview } = opts;
  // Single, robust inline-styled email layout that works across most clients.
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escapeHtml(title)}</title>
  <style>a:hover{opacity:.92}</style>
</head>
<body style="margin:0; padding:0; background:#f3f4f6;">
  ${
    preview
      ? `<div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">
           ${escapeHtml(preview)}
         </div>`
      : ''
  }
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:20px 24px; border-bottom:1px solid #e5e7eb;">
              <h1 style="margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:18px; color:#111827;">
                ${escapeHtml(APP_NAME)}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:12px; line-height:1.6; color:#6b7280;">
                You’re receiving this message because an action was requested in ${escapeHtml(
                  APP_NAME,
                )}.
                If you didn’t expect this, please ignore this email or contact
                <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb; text-decoration:none;">${SUPPORT_EMAIL}</a>.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:11px; color:#9ca3af;">
          © ${new Date().getFullYear()} ${escapeHtml(APP_NAME)}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  resetUrl: string;
  expiresAt?: Date;
}) {
  const { to, resetUrl, expiresAt } = opts;

  const subject = `Reset your ${APP_NAME} password`;
  const preview = `Use this link to reset your ${APP_NAME} password${
    expiresAt ? ` (expires ${expiresAt.toISOString()})` : ''
  }`;

  const safeUrl = escapeHtml(resetUrl);

  const bodyHtml = `
  <div style="font-family:system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#0f172a; line-height:1.6;">
    <h2 style="margin:0 0 12px 0; font-size:20px; color:#111827;">Reset your password</h2>
    <p style="margin:0 0 12px 0;">We received a request to reset your password.</p>
    <p style="margin:0 0 16px 0;">Click the button below to set a new password:</p>
    <p style="margin:16px 0;">
      <a href="${safeUrl}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:600;">
        Reset password
      </a>
    </p>
    <p style="margin:12px 0; word-break:break-all;">
      If the button doesn’t work, copy and paste this link:<br />
      <a href="${safeUrl}" style="color:#2563eb; text-decoration:none;">${safeUrl}</a>
    </p>
    ${
      expiresAt
        ? `<p style="margin:12px 0; color:#374151;">This link expires at <strong>${expiresAt.toISOString()}</strong>.</p>`
        : ''
    }
  </div>
  `.trim();

  const html = emailLayout({ title: subject, preview, bodyHtml });

  const text = [
    `Reset your ${APP_NAME} password`,
    '',
    `We received a request to reset your password.`,
    `Use this link to set a new password:`,
    resetUrl,
    expiresAt ? `\nThis link will expire at ${expiresAt.toISOString()}.` : '',
    `\nIf you didn’t request this, you can safely ignore this email or contact ${SUPPORT_EMAIL}.`,
  ].join('\n');

  if (!resend) {
    // Dev fallback
    console.log(
      '[email:dev-fallback] To:',
      to,
      '\nSubject:',
      subject,
      '\nText:\n',
      text,
    );
    return { id: 'dev-fallback', error: null as null };
  }

  const result = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  if (result.error) {
    console.error('[email] resend error:', result.error);
  }
  return result;
}
