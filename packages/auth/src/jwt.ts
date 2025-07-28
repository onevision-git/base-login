// packages/auth/src/jwt.ts
import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-secret';

/**
 * Sign a JWT access token.
 * @param payload  Any JSON‐serializable data (e.g. { userId })
 * @param expiresIn  Token lifetime (e.g. '15m', '1h')
 * @returns A signed JWT string
 */
export function signAccessToken(
  payload: object,
  expiresIn: string = '15m',
): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn });
}

/**
 * Verify a JWT access token.
 * @param token  The JWT string to verify
 * @returns The decoded payload if valid; throws if invalid/expired.
 */
export function verifyAccessToken(token: string): object | string {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}
