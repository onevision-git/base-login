// File: src/app/api/auth/signup/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Resend } from 'resend';

import Company from '../../../../models/Company';
import User from '../../../../models/User';
import { connect } from '../../../../lib/db';

type SignupBody = {
  email: string;
  password: string;
  orgName: string;
};

export async function POST(req: Request) {
  // Resolve env at runtime (not at import time)
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }
  const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
  // Prefer NEXT_PUBLIC_APP_URL, fall back to request host
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
  const inferredBase = `${new URL(req.url).protocol}//${req.headers.get('host')}`;
  const APP_URL = appUrlEnv && appUrlEnv.trim() ? appUrlEnv : inferredBase;
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
      company = await Company.create({
        name: orgName,
        domain,
        maxUsers: 3, // default max users
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

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
      { expiresIn: '24h' },
    );

    const confirmUrl = `${BASE}/confirm?token=${encodeURIComponent(token)}`;

    // Send email if configured; otherwise just log the URL
    if (resend) {
      try {
        const response = await resend.emails.send({
          from: 'noreply@onevision.co.uk',
          to: email,
          subject: 'Confirm your email',
          html: `<p>Thanks for signing up. Please <a href="${confirmUrl}">click here to confirm your email</a>.</p>`,
        });
        console.log('✔ Email sent via Resend:', response);
      } catch (emailError) {
        console.error('❌ Error sending email via Resend:', emailError);
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
