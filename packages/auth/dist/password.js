// packages/auth/src/password.ts
import bcrypt from 'bcryptjs';
/**
 * Hash a plaintext password.
 * @param password    The plaintext password to hash
 * @param saltRounds  Number of bcrypt salt rounds (default: 10)
 * @returns           A Promise resolving to the hashed password
 */
export function hashPassword(password, saltRounds = 10) {
    return bcrypt.hash(password, saltRounds);
}
/**
 * Compare a plaintext password against a hash.
 * @param password  The plaintext password to verify
 * @param hash      The bcrypt hash to compare against
 * @returns         A Promise resolving to true if they match, else false
 */
export function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}
