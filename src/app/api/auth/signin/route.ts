// File: src/app/api/auth/signin/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { connect } from '../../../../lib/db';
import User from '../../../../models/User';
import type { IUser } from '../../../../models/User';

export async function POST(req: Request) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  try {
    const body = await req.json();
    const emailInput = (body?.email as string | undefined)?.trim();
    const password = (body?.password as string | undefined) ?? '';

    if (!emailInput || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 },
      );
    }

    const email = emailInput.toLowerCase();

    await connect();

    // Use lean<IUser>() to type the result and avoid `any`
    const user = await User.findOne({ email })
      .select('+passwordHash +password')
      .lean<IUser>()
      .exec();

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    if (user.emailVerified === false) {
      return NextResponse.json(
        { error: 'Please verify email first' },
        { status: 403 },
      );
    }

    const storedHash: string | undefined = user.passwordHash || user.password;
    if (!storedHash) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const match = await bcrypt.compare(password, storedHash);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      {
        userId: String(user._id),
        email: user.email,
        companyId: String(user.companyId),
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    const res = NextResponse.json({ message: 'Login successful' });
    res.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    console.error('Signin error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
