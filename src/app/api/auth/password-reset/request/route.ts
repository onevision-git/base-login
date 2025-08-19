// File: src/app/api/auth/password-reset/request/route.ts

import { NextResponse } from 'next/server';
import { createResetToken } from '@/lib/passwordReset';
import { sendPasswordResetEmail } from '@/lib/email';

// Always return 202 to avoid leaking whether an email exists.
// Log internal errors but never surface them to the client.

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  // Required env at runtime (no top-level reads elsewhere)
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
  if (!APP_URL) {
    // If misconfigured, respond as if OK but include a header so we can spot it.
    return NextResponse.json(
      {
        message:
          'If an account exists for that email, we’ve sent a reset link.',
      },
      {
        status: 202,
        headers: { 'x-reset-misconfigured': 'NEXT_PUBLIC_APP_URL missing' },
      },
    );
  }

  // Accept JSON only (UI already sends JSON)
  const ctype = req.headers.get('content-type') || '';
  if (!ctype.includes('application/json')) {
    return NextResponse.json(
      { error: 'Content-Type must be application/json.' },
      { status: 415 },
    );
  }

  // Parse & validate input
  let email = '';
  try {
    const body = await req.json();
    email = (body?.email ?? '').toString().trim().toLowerCase();
  } catch {
    // fall through
  }

  if (!email || !isValidEmail(email)) {
    // Deliberately return 202 to avoid account enumeration
    return NextResponse.json(
      {
        message:
          'If an account exists for that email, we’ve sent a reset link.',
      },
      { status: 202 },
    );
  }

  // Core flow: create token & send email.
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
    // Log but do not leak details
    console.error('[password-reset/request] error:', e);
  }

  // Always 202
  return NextResponse.json(
    {
      message: 'If an account exists for that email, we’ve sent a reset link.',
    },
    { status: 202 },
  );
}

// Only POST is allowed via UI
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}
