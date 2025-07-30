// packages/auth/src/jwt.ts
import jwt from 'jsonwebtoken';
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
/**
 * Sign a JWT containing the given payload.
 */
export function signAccessToken(payload, expiresIn = '15m') {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn });
}
/**
 * Verify a JWT and return its payload.
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
}
