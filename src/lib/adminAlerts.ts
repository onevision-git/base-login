// src/lib/adminAlerts.ts
// Admin alerts: send simple notifications to system admins.
// Uses Resend directly with a minimal shared layout so we control header/footer.
//
// - Header shows NEXT_PUBLIC_APP_NAME (product name)
// - Footer shows NEXT_PUBLIC_ORG_NAME (legal owner)
// - ESLint-safe error handling (no `any`)

import { Resend } from 'resend';

// ---- env helpers ------------------------------------------------------------

function requireEnv(
  name:
    | 'RESEND_API_KEY'
    | 'EMAIL_FROM'
    | 'NEXT_PUBLIC_APP_NAME'
    | 'NEXT_PUBLIC_ORG_NAME',
): string {
  const v = process.env[name];
  if (!v || !v.trim())
    throw new Error(`Missing required environment variable: ${name}`);
  return v.trim();
}

function optionalEnv(
  name: 'NEXT_PUBLIC_SUPPORT_EMAIL' | 'SUPERADMIN_EMAILS',
): string {
  return (process.env[name] ?? '').trim();
}

async function getResend(): Promise<Resend> {
  return new Resend(requireEnv('RESEND_API_KEY'));
}

function parseAdminList(): string[] {
  const list = optionalEnv('SUPERADMIN_EMAILS')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.includes('@'));

  const support = optionalEnv('NEXT_PUBLIC_SUPPORT_EMAIL');
  if (support && support.includes('@')) list.push(support);

  // Deduplicate
  return Array.from(new Set(list));
}

// ---- tiny email layout (header/footer controlled here) ----------------------

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(opts: { title: string; bodyHtml: string; preview?: string }) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Your App';
  const orgName = process.env.NEXT_PUBLIC_ORG_NAME ?? 'Your Company';
  const { title, bodyHtml, preview } = opts;

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
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
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
                You’re receiving this email because you’re listed as a system administrator.
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

function button(href: string, label: string) {
  const s =
    'display:inline-block;padding:10px 16px;border-radius:6px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600';
  return `<a href="${href}" style="${s}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`;
}

// ---- shared sender ----------------------------------------------------------

async function sendHtmlEmail(
  to: string[],
  subject: string,
  html: string,
  text: string,
) {
  const resend = await getResend();
  const from = requireEnv('EMAIL_FROM');

  // Resend supports array for "to"
  await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });
}

// ---- Alerts -----------------------------------------------------------------

/**
 * Admin alert: a new user finished sign-up.
 * Subject includes the app name: "New sign-up by <email> from <APP_NAME>"
 */
export async function sendAdminNewSignupAlert(params: {
  userEmail: string;
  appUrl?: string;
}): Promise<void> {
  const to = parseAdminList();
  if (!to.length) {
    console.warn('[adminAlerts] No admin recipients configured');
    return;
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Your App';
  const subject = `New sign-up by ${params.userEmail} from ${appName}`;
  const preview = subject;
  const dashboardUrl = params.appUrl
    ? `${params.appUrl}/(app)/dashboard`
    : null;

  const bodyHtml = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0f172a; line-height:1.6;">
      <p style="margin:0 0 12px;">A new account has been verified on <strong>${escapeHtml(appName)}</strong>.</p>
      <p style="margin:0 0 12px;"><strong>User:</strong> ${escapeHtml(params.userEmail)}</p>
      ${
        dashboardUrl
          ? `<p style="margin:16px 0;">${button(dashboardUrl, 'Open dashboard')}</p>`
          : ''
      }
    </div>
  `.trim();

  const html = layout({ title: subject, bodyHtml, preview });
  const text = [
    subject,
    'A new account has been verified.',
    `User: ${params.userEmail}`,
    dashboardUrl ? `Open dashboard: ${dashboardUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendHtmlEmail(to, subject, html, text);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[adminAlerts] Failed to send new-signup alert', {
        error: err.message,
      });
    } else {
      console.error('[adminAlerts] Unknown error sending new-signup alert');
    }
  }
}

/**
 * Admin alert: an invite was accepted.
 */
export async function sendAdminInviteAcceptedAlert(params: {
  inviteeEmail: string;
  inviterEmail?: string;
  appUrl?: string;
}): Promise<void> {
  const to = parseAdminList();
  if (!to.length) {
    console.warn('[adminAlerts] No admin recipients configured');
    return;
  }

  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Your App';
  const subject = `Invite accepted by ${params.inviteeEmail}`;
  const preview = `Invite accepted on ${appName}`;
  const teamUrl = params.appUrl ? `${params.appUrl}/(app)/team` : null;

  const bodyHtml = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0f172a; line-height:1.6;">
      <p style="margin:0 0 12px;">An invitee has created their account on <strong>${escapeHtml(appName)}</strong>.</p>
      <p style="margin:0 0 12px;"><strong>Invitee:</strong> ${escapeHtml(params.inviteeEmail)}</p>
      ${
        params.inviterEmail
          ? `<p style="margin:0 0 12px;"><strong>Invited by:</strong> ${escapeHtml(params.inviterEmail)}</p>`
          : ''
      }
      ${teamUrl ? `<p style="margin:16px 0;">${button(teamUrl, 'View team')}</p>` : ''}
    </div>
  `.trim();

  const html = layout({ title: subject, bodyHtml, preview });
  const text = [
    subject,
    'An invitee has created their account.',
    `Invitee: ${params.inviteeEmail}`,
    params.inviterEmail ? `Invited by: ${params.inviterEmail}` : '',
    teamUrl ? `View team: ${teamUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendHtmlEmail(to, subject, html, text);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('[adminAlerts] Failed to send invite-accepted alert', {
        error: err.message,
      });
    } else {
      console.error(
        '[adminAlerts] Unknown error sending invite-accepted alert',
      );
    }
  }
}
