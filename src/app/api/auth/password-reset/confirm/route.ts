// File: src/app/api/auth/password-reset/confirm/route.ts

// Node runtime is required for bcrypt/crypto on Vercel
export const runtime = 'nodejs';
// Never pre-render or cache this handler
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
  verifyResetToken,
  consumeResetToken,
  type ResetTokenDoc,
} from '@/lib/passwordReset';
import { getCollection } from '@/lib/mongodb';
import type { IUser } from '@/models/User';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';

// Small JSON helper (no detail leakage; disables caching)
function json(
  status: number,
  body: Record<string, unknown>,
  headers?: HeadersInit,
) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(headers || {}),
    },
  });
}

// In non-production, a GET acts as a quick probe.
// In production, respond 405 to avoid exposing internals.
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Method Not Allowed', { status: 405 });
  }
  const enabled = process.env.ENABLE_PASSWORD_RESET === 'true';
  return json(200, {
    ok: true,
    route: '/api/auth/password-reset/confirm',
    resetEnabled: enabled,
    env: process.env.NODE_ENV,
  });
}

// POST: perform the password reset
export async function POST(req: Request) {
  // Feature flag so we can hard-disable in environments if needed.
  const RESET_ENABLED = process.env.ENABLE_PASSWORD_RESET === 'true';
  if (!RESET_ENABLED) {
    // 404 so we don't advertise the route when disabled
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'x-reset-enabled': 'false' },
    });
  }

  // --- Rate limit: 10 requests / 5 min per IP ------------------------------
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const rl = checkRateLimit(`pwreset:confirm:${ip}`, 10, 5 * 60 * 1000);
  if (!rl.allowed) {
    return json(
      429,
      { error: 'Too many attempts. Please wait a moment.' },
      rateLimitHeaders(rl),
    );
  }
  // -------------------------------------------------------------------------

  // Parse & validate payload
  let token = '';
  let newPassword = '';

  try {
    const body: { token?: string; newPassword?: string } = await req.json();
    token = (body?.token ?? '').trim();
    newPassword = body?.newPassword ?? '';
  } catch {
    return json(
      400,
      { ok: false, error: 'Invalid JSON payload.' },
      rateLimitHeaders(rl),
    );
  }

  if (!token || !newPassword) {
    return json(
      400,
      { ok: false, error: 'Missing token or password.' },
      rateLimitHeaders(rl),
    );
  }
  if (newPassword.length < 8) {
    return json(
      422,
      { ok: false, error: 'Password must be at least 8 characters.' },
      rateLimitHeaders(rl),
    );
  }

  try {
    // 1) Verify token
    const verified = await verifyResetToken(token);
    if (!verified) {
      return json(
        400,
        { ok: false, error: 'Invalid or expired token.' },
        rateLimitHeaders(rl),
      );
    }

    // 2) Hash & update user password
    const emailLc = verified.email.toLowerCase();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const users = await getCollection<IUser>('users');
    const now = new Date();

    // Legacy 'password' field removed — write only passwordHash moving forward
    await users.updateOne(
      { email: emailLc },
      {
        $set: {
          passwordHash,
          passwordUpdatedAt: now,
          updatedAt: now,
        },
        $unset: {
          // Optional: if a legacy field exists, remove it to keep docs clean
          password: '',
        },
      },
    );

    // 3) Consume this token and invalidate any others for the same email
    await consumeResetToken(token);

    const tokensCol = await getCollection<ResetTokenDoc>(
      'password_reset_tokens',
    );
    await tokensCol.updateMany(
      { email: emailLc, used: false },
      { $set: { used: true, usedAt: now } },
    );

    // 4) Done
    return json(
      200,
      {
        ok: true,
        message: 'Your password has been updated. You can now sign in.',
      },
      { 'x-reset-enabled': 'true', ...rateLimitHeaders(rl) },
    );
  } catch (err) {
    console.error('[password-reset][confirm] unexpected error:', err);
    // Stay idempotent & don’t leak internals
    return json(
      200,
      {
        ok: true,
        message: 'If the token was valid, your password has been updated.',
      },
      { 'x-reset-enabled': 'true', ...rateLimitHeaders(rl) },
    );
  }
}
