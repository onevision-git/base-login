// src/lib/authTokens.ts
// Verify auth JWTs and invalidate any issued before passwordUpdatedAt.

import jwt, { JwtPayload } from 'jsonwebtoken';
import { connect } from './db';
import User from '../models/User';

export type AuthTokenPayload = JwtPayload & {
  userId: string;
  email: string;
  companyId?: string;
  role?: string;
};

/**
 * Verify a JWT string and ensure it's still valid for the user:
 * - Signature + expiry check
 * - User exists
 * - If user.passwordUpdatedAt is set, token.iat must be >= passwordUpdatedAt
 *
 * IMPORTANT: Never throw on missing env during build; return a failure instead.
 */
export async function verifyJwtAndUser(token: string) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    // Treat as an auth failure rather than throwing, so Next build doesn't crash.
    return { ok: false as const, status: 500, reason: 'missing-secret' };
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;

    if (!payload?.userId) {
      return { ok: false as const, status: 401, reason: 'invalid-payload' };
    }

    await connect();

    const user = await User.findById(payload.userId).select(
      'email companyId role passwordUpdatedAt',
    );

    if (!user) {
      return { ok: false as const, status: 401, reason: 'user-not-found' };
    }

    if (user.passwordUpdatedAt) {
      const tokenIatMs =
        typeof payload.iat === 'number' ? payload.iat * 1000 : 0;
      const pwdUpdatedAtMs = user.passwordUpdatedAt.getTime();
      if (tokenIatMs < pwdUpdatedAtMs) {
        return {
          ok: false as const,
          status: 401,
          reason: 'token-stale-after-password-change',
        };
      }
    }

    return {
      ok: true as const,
      user,
      payload,
    };
  } catch {
    return { ok: false as const, status: 401, reason: 'jwt-verify-failed' };
  }
}

/**
 * Tiny helper to extract the "token" cookie value from a standard Request.
 */
export function getTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const parts = cookieHeader.split(';').map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith('token=')) {
      return decodeURIComponent(p.slice('token='.length));
    }
  }
  return null;
}
