/**
 * Hash a plaintext password.
 * @param password    The plaintext password to hash
 * @param saltRounds  Number of bcrypt salt rounds (default: 10)
 * @returns           A Promise resolving to the hashed password
 */
export declare function hashPassword(
  password: string,
  saltRounds?: number,
): Promise<string>;
/**
 * Compare a plaintext password against a hash.
 * @param password  The plaintext password to verify
 * @param hash      The bcrypt hash to compare against
 * @returns         A Promise resolving to true if they match, else false
 */
export declare function comparePassword(
  password: string,
  hash: string,
): Promise<boolean>;
//# sourceMappingURL=password.d.ts.map
