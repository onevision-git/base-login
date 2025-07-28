// packages/auth/__tests__/jwt.test.ts
import { signAccessToken, verifyAccessToken } from '../src/jwt';

// Ensure the test secret is deterministic
beforeAll(() => {
  process.env.ACCESS_TOKEN_SECRET = 'test-secret';
});

describe('JWT utility functions', () => {
  it('signs and verifies a payload correctly', () => {
    const payload = { userId: 'user-123' };
    const token = signAccessToken(payload, '1h');
    const decoded = verifyAccessToken(token) as Record<string, any>;
    expect(decoded.userId).toBe(payload.userId);
  });

  it('throws on invalid token', () => {
    expect(() => verifyAccessToken('invalid.token.here')).toThrow();
  });
});
