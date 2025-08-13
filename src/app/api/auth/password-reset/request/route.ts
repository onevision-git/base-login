import { NextResponse } from 'next/server';
import { createResetToken } from '@/lib/passwordReset';
import { getCollection } from '@/lib/mongodb';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import type { IUser } from '@/models/User';

function getClientIp(req: Request): string {
  const xfwd = req.headers.get('x-forwarded-for');
  if (xfwd) {
    const first = xfwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

export async function POST(req: Request) {
  const ENABLED = process.env.ENABLE_PASSWORD_RESET === 'true';
  const RL_LIMIT = parseInt(process.env.RESET_RL_LIMIT || '5', 10);
  const RL_WINDOW_MS = parseInt(
    process.env.RESET_RL_WINDOW_MS || String(15 * 60 * 1000),
    10,
  );

  if (!ENABLED) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'x-reset-enabled': 'false' },
    });
  }

  let email: string | undefined;
  try {
    const body = await req.json();
    email = (body?.email as string | undefined)?.trim();
  } catch {
    // ignore
  }

  if (!email) {
    return new NextResponse('Email is required', { status: 400 });
  }

  const emailLc = email.toLowerCase();

  const ip = getClientIp(req);
  const key = `pwdreset:${ip}:${emailLc}`;
  const rl = checkRateLimit(key, RL_LIMIT, RL_WINDOW_MS);
  if (!rl.allowed) {
    return new NextResponse('Too many requests', {
      status: 429,
      headers: {
        ...rateLimitHeaders(rl),
        'x-reset-enabled': 'true',
      },
    });
  }

  let devToken: string | undefined;

  try {
    const users = await getCollection<IUser>('users');
    const user = await users.findOne({ email: emailLc });

    if (user) {
      const { token, expiresAt } = await createResetToken(emailLc);

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        `${new URL(req.url).protocol}//${req.headers.get('host')}`;
      const base = appUrl.replace(/\/$/, '');
      const resetUrl = `${base}/reset-password?token=${encodeURIComponent(token)}`;

      await sendPasswordResetEmail({ to: emailLc, resetUrl, expiresAt });

      console.log(
        '[password-reset] resetUrl:',
        resetUrl,
        'expiresAt:',
        expiresAt.toISOString(),
      );

      if (process.env.NODE_ENV !== 'production') {
        devToken = token;
      }
    }
  } catch (err) {
    console.error('[password-reset][request] error:', err);
  }

  const headers: HeadersInit = {
    ...rateLimitHeaders(rl),
    'x-reset-enabled': 'true',
  };
  if (devToken) headers['x-dev-reset-token'] = devToken;

  return new NextResponse(null, { status: 202, headers });
}
