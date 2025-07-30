// packages/auth/__tests__/email.test.ts

// Mock the Resend SDK before importing the module under test
const mockSend = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

import { sendMagicLinkEmail } from '../src/email';

describe('sendMagicLinkEmail', () => {
  beforeAll(() => {
    process.env.EMAIL_FROM = 'no-reply@test.com';
    process.env.NEXTAUTH_URL = 'https://app.test';
    process.env.RESEND_API_KEY = 'test-key';
  });

  it('should call resend.emails.send with correct parameters', async () => {
    const to = 'user@example.com';
    const token = 'abc123';
    await sendMagicLinkEmail(to, token);

    expect(mockSend).toHaveBeenCalledWith({
      from: 'no-reply@test.com',
      to,
      subject: 'Your Magic Link',
      html: expect.stringContaining(`/api/auth/verify?token=${token}`),
    });
  });
});
