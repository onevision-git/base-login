// File: packages/auth/src/email.ts

import { Resend } from 'resend';

// Build-safety: no top-level env reads or client init.
// Everything happens at runtime inside functions.

function requireEnv(
  name:
    | 'RESEND_API_KEY'
    | 'EMAIL_FROM'
    | 'NEXT_PUBLIC_APP_URL'
    | 'NEXT_PUBLIC_APP_NAME'
    | 'NEXT_PUBLIC_ORG_NAME',
): string {
  const v = process.env[name];
  if (!v || !v.trim())
    throw new Error(`Missing required environment variable: ${name}`);
  return v.trim();
}

function withoutTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function button(href: string, label: string) {
  const s =
    'display:inline-block;padding:12px 18px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600';
  return `<a href="${href}" style="${s}" target="_blank" rel="noopener">${escapeHtml(
    label,
  )}</a>`;
}

function layout(opts: { title: string; bodyHtml: string; preview?: string }) {
  const { title, bodyHtml, preview } = opts;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Your App';
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || 'Your Company';

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
      ? `<div style="display:none; overflow:hidden; line-height:1px; opacity:0; max-height:0; max-width:0;">${escapeHtml(
          preview,
        )}</div>`
      : ''
  }
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:20px 24px; border-bottom:1px solid #e5e7eb;">
              <h1 style="margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:18px; color:#111827;">
                ${escapeHtml(appName)}
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
                You’re receiving this email because it was requested from ${escapeHtml(appName)}.
                If you didn’t expect this, you can ignore it or contact support.
              </p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0 0; font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; font-size:11px; color:#9ca3af;">
          © ${new Date().getFullYear()} ${escapeHtml(orgName)}. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

async function getResendClient(): Promise<Resend> {
  const key = requireEnv('RESEND_API_KEY');
  // Lazy-init the client when needed
  return new Resend(key);
}

// Safely read { data: { id } } without using `any`
function getEmailId(response: unknown): string | null {
  if (response && typeof response === 'object' && 'data' in response) {
    const data = (response as { data?: unknown }).data;
    if (data && typeof data === 'object' && 'id' in data) {
      const idValue = (data as { id?: unknown }).id;
      return typeof idValue === 'string' ? idValue : null;
    }
  }
  return null;
}

/**
 * Magic-link email (sign-up confirm + sign-in). Uses shared layout & text fallback.
 */
export async function sendMagicLink(to: string, link: string) {
  const resend = await getResendClient();
  const from = requireEnv('EMAIL_FROM');
  const appUrl = withoutTrailingSlash(requireEnv('NEXT_PUBLIC_APP_URL'));

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Your App';
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || 'Your Company';

  const safe = escapeHtml(link);
  // Subject should use the organisation name (legal entity)
  const subject = `Confirm your ${appName} email`;
  const preview = `Click the button to confirm your email and continue.`;

  const bodyHtml = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0f172a; line-height:1.6;">
      <h2 style="margin:0 0 12px 0; font-size:20px; color:#111827;">Confirm your email</h2>
      <p style="margin:0 0 12px 0;">Thanks for signing up. Click the button below to confirm your email and finish setting up your account.</p>
      <p style="margin:16px 0;">
        ${button(safe, 'Confirm email')}
      </p>
      <p style="margin:12px 0; word-break:break-all;">
        Or copy and paste this link:<br />
        <a href="${safe}" style="color:#2563eb; text-decoration:none;">${safe}</a>
      </p>
      <p style="margin:16px 0 0 0; font-size:13px; color:#334155;">
        After confirming, you’ll be redirected to your dashboard: ${escapeHtml(
          appUrl,
        )}/(app)/dashboard
      </p>
    </div>
  `.trim();

  const html = layout({ title: subject, bodyHtml, preview });
  const text = [
    `Confirm your ${appName} email`,
    '',
    `Thanks for signing up. Open this link to confirm your email:`,
    link,
    '',
    `Dashboard: ${appUrl}/(app)/dashboard`,
  ].join('\n');

  const response = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  console.log('[sendMagicLink] sent', {
    to,
    id: getEmailId(response),
  });
}

/**
 * Invite email (supports optional inviterEmail for copy).
 */
export async function sendInviteEmail(params: {
  to: string;
  token: string;
  companyName?: string;
  inviterEmail?: string; // optional
}) {
  const resend = await getResendClient();
  const from = requireEnv('EMAIL_FROM');
  const appUrl = withoutTrailingSlash(requireEnv('NEXT_PUBLIC_APP_URL'));

  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Your App';
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || 'Your Company';

  const { to, token, companyName, inviterEmail } = params;

  const link = `${appUrl}/accept-invite?token=${encodeURIComponent(token)}`;
  const safeLink = escapeHtml(link);

  // If companyName provided (tenant-level), prefer it; otherwise use the organisation name.
  const subject = companyName
    ? `You’re invited to join ${companyName}`
    : `You’re invited to join ${appName}`;
  const preview = `Accept the invite and set your password to join.`;

  const invitedByLine = inviterEmail
    ? `<p style="margin:0 0 12px; color:#334155;"><strong>${escapeHtml(
        inviterEmail,
      )}</strong> has invited you to sign up to ${escapeHtml(appName)}.</p>`
    : '';

  const bodyHtml = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0f172a; line-height:1.6;">
      <h2 style="margin:0 0 12px 0; font-size:20px; color:#111827;">You're invited</h2>
      ${invitedByLine}
      <p style="margin:0 0 16px">Click the button below to accept the invite and set your password.</p>
      <p style="margin:16px 0;">
        ${button(safeLink, 'Accept invite')}
      </p>
      <p style="margin:12px 0; word-break:break-all;">
        Or paste this link into your browser:<br />
        <a href="${safeLink}" style="color:#2563eb; text-decoration:none;">${safeLink}</a>
      </p>
      <p style="margin:16px 0 0 0; font-size:13px; color:#334155;">
        After accepting, you’ll be redirected to the sign-in page.
      </p>
    </div>
  `.trim();

  const text = [
    subject,
    inviterEmail
      ? `${inviterEmail} has invited you to sign up to ${appName}.`
      : '',
    '',
    'Accept the invite and set your password using this link:',
    link,
  ]
    .filter(Boolean)
    .join('\n');

  const html = layout({ title: subject, bodyHtml, preview });

  const response = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  console.log('[sendInviteEmail] sent', {
    to,
    id: getEmailId(response),
  });
}

/**
 * Admin alert: new sign-up notification.
 * Subject will be: "New sign-up by <email> from <ORG_NAME>"
 */
export async function sendAdminNewSignupAlert(params: {
  to: string;
  newUserEmail: string;
}) {
  const resend = await getResendClient();
  const from = requireEnv('EMAIL_FROM');
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Your App';
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME || 'Your Company';
  const { to, newUserEmail } = params;

  // Use organisation for the source attribution in subject
  const subject = `New sign-up by ${newUserEmail} from ${orgName}`;
  const preview = subject;

  const bodyHtml = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0f172a; line-height:1.6;">
      <h2 style="margin:0 0 12px 0; font-size:18px; color:#111827;">New sign-up</h2>
      <p style="margin:0 0 12px;">A new user has signed up to <strong>${escapeHtml(
        appName,
      )}</strong>.</p>
      <p style="margin:0 0 12px;"><strong>Email:</strong> ${escapeHtml(
        newUserEmail,
      )}</p>
    </div>
  `.trim();

  const html = layout({ title: subject, bodyHtml, preview });
  const text = [
    `New sign-up`,
    `App: ${appName}`,
    `Email: ${newUserEmail}`,
  ].join('\n');

  const response = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  console.log('[sendAdminNewSignupAlert] sent', {
    to,
    id: getEmailId(response),
  });
}
