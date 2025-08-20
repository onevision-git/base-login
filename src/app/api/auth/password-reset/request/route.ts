// File: src/app/api/auth/password-reset/request/route.ts

import { NextResponse } from 'next/server';
import { createResetToken } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';

// Always return 202 to avoid leaking whether an email exists.
// Log internal errors but never surface them to the client.

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

type RequestBody = {
  email?: string;
};

export async function POST(req: Request) {
  // Rate-limit by IP (in-memory; swap for Redis/Upstash in production)
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rate = checkRateLimit(`pwreset:request:${ip}`, 5, 15 * 60 * 1000); // 5 requests / 15min
  if (!rate.allowed) {
    return NextResponse.json(
      { message: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!APP_URL) {
    return NextResponse.json(
      {
        message:
          'If an account exists for that email, we’ve sent a reset link.',
      },
      {
        status: 202,
        headers: {
          'x-reset-misconfigured': 'NEXT_PUBLIC_APP_URL missing',
          ...rateLimitHeaders(rate),
        },
      },
    );
  }

  // Accept JSON only (UI already sends JSON)
  const ctype = req.headers.get('content-type') || '';
  if (!ctype.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json.' },
      { status: 415, headers: rateLimitHeaders(rate) },
    );
  }

  // Parse & validate input
  let email = '';
  try {
    const body: RequestBody = await req.json();
    email = (body.email ?? '').toString().trim().toLowerCase();
  } catch {
    // fall through
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      {
        message:
          'If an account exists for that email, we’ve sent a reset link.',
      },
      { status: 202, headers: rateLimitHeaders(rate) },
    );
  }

  // Core flow: create token & send email
  try {
    const { token, expiresAt } = await createResetToken(email);

    const base = APP_URL.replace(/\/+$/, '');
    const resetUrl = `${base}/reset-password?token=${encodeURIComponent(
      token,
    )}`;

    await sendPasswordResetEmail({
      to: email,
      resetUrl,
      expiresAt,
    });
  } catch (e) {
    console.error('[password-reset/request] error:', e);
  }

  return NextResponse.json(
    {
      message: 'If an account exists for that email, we’ve sent a reset link.',
    },
    { status: 202, headers: rateLimitHeaders(rate) },
  );
}

// Only POST is allowed via UI
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
