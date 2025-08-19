// src/lib/adminAlerts.ts
// Admin alert utilities: send simple notifications to system admins.
// Reads SUPERADMIN_EMAILS and uses the generic sendEmail() helper.

import { sendEmail } from './email';

function parseAdminList(): string[] {
  const raw = process.env.SUPERADMIN_EMAILS || '';
  return Array.from(
    new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.includes('@')),
    ),
  );
}

function button(href: string, label: string) {
  const s =
    'display:inline-block;padding:10px 16px;border-radius:6px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600';
  return `<a href="${href}" style="${s}" target="_blank" rel="noopener">${label}</a>`;
}

function wrap(subject: string, innerHtml: string) {
  const container =
    'max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff';
  const h1 = 'font-size:18px;margin:0 0 12px;color:#111827';
  const p = 'font-size:14px;line-height:1.5;color:#111827;margin:0 0 12px;';
  const small = 'font-size:12px;color:#6b7280;margin-top:24px;';
  return `
  <div style="background:#f9fafb;padding:24px;">
    <div style="${container}">
      <h1 style="${h1}">${subject}</h1>
      <div style="${p}">
        ${innerHtml}
      </div>
      <div style="${small}">
        This is a system notification. You receive this because you are listed as a system administrator.
      </div>
    </div>
  </div>
  `.trim();
}

export async function sendAdminNewSignupAlert(params: {
  userEmail: string;
  appUrl?: string;
}) {
  const to = parseAdminList();
  if (!to.length) return;

  const subject = `New sign-up by ${params.userEmail}`;
  const dashboardUrl = params.appUrl
    ? `${params.appUrl}/(app)/dashboard`
    : null;

  const html = wrap(
    subject,
    `
      <p>A new account has been verified.</p>
      <p><strong>User:</strong> ${params.userEmail}</p>
      ${
        dashboardUrl
          ? `<p style="margin:16px 0">${button(dashboardUrl, 'Open dashboard')}</p>`
          : ''
      }
    `,
  );

  const text = [
    subject,
    'A new account has been verified.',
    `User: ${params.userEmail}`,
    dashboardUrl ? `Open dashboard: ${dashboardUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  await sendEmail({ to, subject, html, text });
}

export async function sendAdminInviteAcceptedAlert(params: {
  inviteeEmail: string;
  inviterEmail?: string;
  appUrl?: string;
}) {
  const to = parseAdminList();
  if (!to.length) return;

  const subject = `Invite accepted by ${params.inviteeEmail}`;
  const teamUrl = params.appUrl ? `${params.appUrl}/(app)/team` : null;

  const html = wrap(
    subject,
    `
      <p>An invitee has created their account.</p>
      <p><strong>Invitee:</strong> ${params.inviteeEmail}</p>
      ${
        params.inviterEmail
          ? `<p><strong>Invited by:</strong> ${params.inviterEmail}</p>`
          : ''
      }
      ${
        teamUrl
          ? `<p style="margin:16px 0">${button(teamUrl, 'View team')}</p>`
          : ''
      }
    `,
  );

  const text = [
    subject,
    'An invitee has created their account.',
    `Invitee: ${params.inviteeEmail}`,
    params.inviterEmail ? `Invited by: ${params.inviterEmail}` : '',
    teamUrl ? `View team: ${teamUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  await sendEmail({ to, subject, html, text });
}
