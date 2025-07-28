// packages/auth/__tests__/password.test.ts
import { hashPassword, comparePassword } from '../src/password';

describe('Password hashing utilities', () => {
  const plain = 'mySecureP@ssw0rd';

  it('hashPassword should produce a different string than the plaintext', async () => {
    const hash = await hashPassword(plain, 4); // use fewer rounds for speed
    expect(hash).not.toBe(plain);
    expect(typeof hash).toBe('string');
  });

  it('comparePassword should return true for matching password/hash', async () => {
    const hash = await hashPassword(plain, 4);
    const match = await comparePassword(plain, hash);
    expect(match).toBe(true);
  });

  it('comparePassword should return false for non-matching password', async () => {
    const hash = await hashPassword(plain, 4);
    const match = await comparePassword('wrongPassword', hash);
    expect(match).toBe(false);
  });
});
