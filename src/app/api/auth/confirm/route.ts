import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '@auth/models/User';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };

    await mongoose.connect(process.env.MONGODB_URI!);

    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Already verified' },
        { status: 200 },
      );
    }

    user.emailVerified = true;
    await user.save();

    return NextResponse.json({ message: 'Email confirmed' }, { status: 200 });
  } catch (err) {
    console.error('Confirm error:', err);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 },
    );
  }
}
