import { JwtPayload } from 'jsonwebtoken';
/**
 * Sign a JWT containing the given payload.
 */
export declare function signAccessToken(payload: object, expiresIn?: string | number): string;
/**
 * Verify a JWT and return its payload.
 */
export declare function verifyAccessToken(token: string): JwtPayload;
//# sourceMappingURL=jwt.d.ts.map