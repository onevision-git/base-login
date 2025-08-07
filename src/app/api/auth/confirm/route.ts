// File: src/app/api/auth/confirm/route.ts

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

import { User } from '../../../../models/User';
import connect from '../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    await connect();

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: 'Email already verified' });
    }

    user.emailVerified = true;
    await user.save();

    return NextResponse.json({ message: 'Email confirmed successfully' });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 },
    );
  }
}
