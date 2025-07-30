// packages/auth/src/email.ts

import { Resend } from 'resend';

// Resend constructor expects the API key string directly
const resend = new Resend(process.env.RESEND_API_KEY as string);

/**
 * Send a magic-link email via Resend.
 */
export async function sendMagicLinkEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM as string,
    to,
    subject: 'Your Magic Link',
    html: `
      <p>Hello,</p>
      <p>Click <a href="${url}">here to sign in</a>.</p>
      <p>This link is valid for 15 minutes.</p>
    `,
  });
}
