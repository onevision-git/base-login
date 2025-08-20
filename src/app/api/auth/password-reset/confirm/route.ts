// File: src/app/api/auth/password-reset/confirm/route.ts

// Node runtime is required for bcrypt/crypto
export const runtime = 'nodejs';
// Ensure this route is never statically cached
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

// Small helper for consistent JSON responses
function json(
  status: number,
  body: Record<string, unknown>,
  headers?: HeadersInit,
) {
  return new NextResponse(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
  });
}

export async function POST(req: Request) {
  // Feature‑flag so prod/test can turn this on/off safely via env vars
  const RESET_ENABLED = process.env.ENABLE_PASSWORD_RESET === 'true';
  if (!RESET_ENABLED) {
    // Intentionally 404 to avoid advertising the route when disabled
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'x-reset-enabled': 'false' },
    });
  }

  let token = '';
  let newPassword = '';

  // Parse & validate input
  try {
    const body = await req.json();
    token = (body?.token as string | undefined)?.trim() || '';
    newPassword = (body?.newPassword as string | undefined) || '';
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON payload.' });
  }

  if (!token || !newPassword) {
    return json(400, { ok: false, error: 'Missing token or password.' });
  }
  if (newPassword.length < 8) {
    return json(422, {
      ok: false,
      error: 'Password must be at least 8 characters.',
    });
  }

  try {
    // 1) Verify token
    const verified = await verifyResetToken(token);
    if (!verified) {
      return json(400, { ok: false, error: 'Invalid or expired token.' });
    }

    // 2) Hash & update user password
    const emailLc = verified.email.toLowerCase();
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const users = await getCollection<IUser>('users');
    const now = new Date();

    await users.updateOne(
      { email: emailLc },
      {
        $set: {
          passwordHash,
          // legacy compatibility (can be removed after data migration)
          password: passwordHash,
          passwordUpdatedAt: now,
          updatedAt: now,
        },
      },
    );

    // 3) Consume this token and invalidate any other outstanding tokens for the same email
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
      { 'x-reset-enabled': 'true' },
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
      { 'x-reset-enabled': 'true' },
    );
  }
}
