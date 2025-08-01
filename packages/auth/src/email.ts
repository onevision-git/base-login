import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMagicLink(to: string, link: string) {
  console.log('[sendMagicLink] Sending to:', to);
  console.log('[sendMagicLink] Link:', link);

  const response = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: 'Confirm your email',
    html: `<p>Click here to log in: <a href="${link}">${link}</a></p>`,
  });

  console.log('[sendMagicLink] Resend API response:', response);
}
