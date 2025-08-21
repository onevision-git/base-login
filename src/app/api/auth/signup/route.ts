// File: src/app/api/auth/signup/route.ts

// Ensure Node.js runtime for native bcrypt/JWT + warm DB reuse
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

import Company from '../../../../models/Company';
import User from '../../../../models/User';
import { connect } from '../../../../lib/db';
import { getDefaultCompanyMaxUsers } from '../../../../lib/systemSettings';

type SignupBody = {
  email: string;
  password: string;
  orgName: string;
};

// Lock bcrypt cost factor for new hashes
const SALT_ROUNDS = 10;

export async function POST(req: Request) {
  // Resolve env at runtime (not at import time)
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@onevision.co.uk';
  const APP_URL_ENV = process.env.NEXT_PUBLIC_APP_URL;

  // Prefer NEXT_PUBLIC_APP_URL; fall back to request host for the confirm link
  const inferredBase = `${new URL(req.url).protocol}//${req.headers.get('host')}`;
  const APP_URL =
    APP_URL_ENV && APP_URL_ENV.trim() ? APP_URL_ENV : inferredBase;
  const BASE = APP_URL.replace(/\/$/, '');

  // Lazy init email client only if configured
  const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

  try {
    const raw = (await req.json()) as Partial<SignupBody>;

    const email =
      typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';
    const password = typeof raw.password === 'string' ? raw.password : '';
    const orgName = typeof raw.orgName === 'string' ? raw.orgName.trim() : '';

    if (!email || !password || !orgName) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await connect();

    // Create / reuse company by domain
    const domain = email.split('@')[1]!;
    let company = await Company.findOne({ domain });

    if (!company) {
      // Get platform default from System Settings
      const defaultMaxUsers = await getDefaultCompanyMaxUsers();

      company = await Company.create({
        name: orgName,
        domain,
        maxUsers: defaultMaxUsers, // seeded from System Settings
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 },
      );
    }

    // 🔒 Consistent, performant bcrypt cost for all new hashes
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email,
      passwordHash,
      companyId: company._id,
      role: 'admin',
      emailVerified: false,
    });

    // Sign a one-time confirm token
    const token = jwt.sign(
      { email: user.email, userId: user._id },
      JWT_SECRET,
      {
        expiresIn: '24h',
      },
    );

    const confirmUrl = `${BASE}/confirm?token=${encodeURIComponent(token)}`;

    // ─────────────────────────────────────────────────────────────────────
    // Styled email path (shared template) when env is fully configured
    // ─────────────────────────────────────────────────────────────────────
    if (resend) {
      if (APP_URL_ENV && APP_URL_ENV.trim()) {
        try {
          const { sendMagicLink } = await import(
            '../../../../../packages/auth/src/email'
          );
          await sendMagicLink(email, confirmUrl);
          console.log(
            '✔ Signup email sent via shared template (sendMagicLink)',
          );
        } catch (emailError) {
          // Fall back to simple HTML on any template/env issue
          console.error(
            '⚠ sendMagicLink failed; falling back to simple HTML:',
            emailError,
          );
          try {
            const response = await resend.emails.send({
              from: EMAIL_FROM,
              to: email,
              subject: 'Confirm your email',
              html: `<p>Thanks for signing up. Please <a href="${confirmUrl}">click here to confirm your email</a>.</p>`,
            });
            console.log('✔ Email sent via Resend (fallback):', response);
          } catch (fallbackErr) {
            console.error(
              '❌ Error sending email via Resend (fallback):',
              fallbackErr,
            );
          }
        }
      } else {
        // No NEXT_PUBLIC_APP_URL -> keep original simple HTML
        try {
          const response = await resend.emails.send({
            from: EMAIL_FROM,
            to: email,
            subject: 'Confirm your email',
            html: `<p>Thanks for signing up. Please <a href="${confirmUrl}">click here to confirm your email</a>.</p>`,
          });
          console.log('✔ Email sent via Resend (no APP_URL env):', response);
        } catch (emailError) {
          console.error('❌ Error sending email via Resend:', emailError);
        }
      }
    } else {
      console.warn(
        '[signup] RESEND_API_KEY not set; confirmation URL:',
        confirmUrl,
      );
    }

    return NextResponse.json({ message: 'Confirmation email sent' });
  } catch (error) {
    console.error('❌ Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
