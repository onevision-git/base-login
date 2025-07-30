// packages/auth/src/jwt.ts

import jwt, { SignOptions, JwtPayload, Secret } from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET as Secret;

/**
 * Sign a JWT containing the given payload.
 */
export function signAccessToken(
  payload: object,
  expiresIn: string | number = '15m',
): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn } as SignOptions);
}

/**
 * Verify a JWT and return its payload.
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
}
