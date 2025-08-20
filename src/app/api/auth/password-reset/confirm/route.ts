// File: src/app/api/auth/password-reset/confirm/route.ts

// Ensure Node.js runtime (needed for bcrypt/crypto)
export const runtime = 'nodejs';
// Force dynamic so Vercel builds a server function even if it thinks the route is static
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import {
  verifyResetToken,
  consumeResetToken,
  type ResetTokenDoc,
} from '@/lib/passwordReset';
import { getCollection } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import type { IUser } from '@/models/User';

// --- TEMP: GET for deploy verification (safe to keep; it returns no secrets) ---
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: '/api/auth/password-reset/confirm',
    resetEnabled: process.env.ENABLE_PASSWORD_RESET === 'true',
  });
}
// ------------------------------------------------------------------------------

// Helper to make consistent JSON responses (without leaking details)
function json(
  status: number,
  body?: Record<string, unknown>,
  headers?: HeadersInit,
) {
  return new NextResponse(body ? JSON.stringify(body) : null, {
    status,
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
  });
}

export async function POST(req: Request) {
  const ENABLED = process.env.ENABLE_PASSWORD_RESET === 'true';

  if (!ENABLED) {
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'x-reset-enabled': 'false' },
    });
  }

  let token: string | undefined;
  let newPassword: string | undefined;

  try {
    const body = await req.json();
    token = (body?.token as string | undefined)?.trim();
    newPassword = (body?.newPassword as string | undefined) ?? '';
  } catch {
    // fall through to validation
  }

  if (!token || !newPassword) {
    return json(400, { error: 'Missing token or password.' });
  }
  if (newPassword.length < 8) {
    return json(422, { error: 'Password must be at least 8 characters.' });
  }

  try {
    const verified = await verifyResetToken(token);
    if (!verified) {
      return json(400, { error: 'Invalid or expired token.' });
    }

    const emailLc = verified.email.toLowerCase();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const users = await getCollection<IUser>('users');
    const now = new Date();
    await users.updateOne(
      { email: emailLc },
      {
        $set: {
          passwordHash,
          password: passwordHash, // legacy compat
          passwordUpdatedAt: now,
          updatedAt: now,
        },
      },
    );

    await consumeResetToken(token);
    const tokens = await getCollection<ResetTokenDoc>('password_reset_tokens');
    await tokens.updateMany(
      { email: emailLc, used: false },
      { $set: { used: true, usedAt: now } },
    );

    return json(
      202,
      { message: 'Your password has been updated. You can now sign in.' },
      { 'x-reset-enabled': 'true' },
    );
  } catch (err) {
    console.error('[password-reset][confirm] error:', err);
    return json(
      202,
      { message: 'If the token was valid, your password has been updated.' },
      { 'x-reset-enabled': 'true' },
    );
  }
}
