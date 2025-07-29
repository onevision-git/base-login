// packages/auth/src/email.ts

import { Resend } from 'resend';

const resend = new Resend({ apiKey: process.env.RESEND_API_KEY! });

/**
 * Send a magic-link email via Resend.
 * @param to     Recipient’s email address
 * @param token  The JWT magic link token
 */
export async function sendMagicLinkEmail(
  to: string,
  token: string,
): Promise<void> {
  const url = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: 'Your Magic Link',
    html: `
      <p>Hello,</p>
      <p>Click <a href="${url}">here to sign in</a>.</p>
      <p>This link is valid for 15 minutes.</p>
    `,
  });
}
