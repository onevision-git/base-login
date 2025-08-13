// File: src/app/api/auth/confirm/route.ts

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import User from '../../../../models/User';
import { connect } from '../../../../lib/db'; // named import

type ConfirmBody = {
  token: string;
};

export async function POST(req: Request) {
  // Load env var at runtime
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  try {
    const raw = (await req.json()) as Partial<ConfirmBody>;
    const token = typeof raw.token === 'string' ? raw.token : '';

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    await connect();

    let payload: { userId: string; email: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
      };
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 },
      );
    }

    const userId = new mongoose.Types.ObjectId(payload.userId);
    const user = await User.findById(userId);

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
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
