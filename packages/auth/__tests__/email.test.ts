// packages/auth/__tests__/email.test.ts

import { Resend } from 'resend';
import { sendMagicLinkEmail } from '../src/email';

// Create a single mock for the send function
const mockSend = jest.fn();

// When 'resend' is imported, return our mocked Resend class
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

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
