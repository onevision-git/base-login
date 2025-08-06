import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
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

    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    // Create short-lived access token for session
    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        companyId: user.companyId?.toString(),
      },
      JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Set HttpOnly cookie (Next.js 15+ requires awaiting cookies())
    (await cookies()).set({
      name: 'access_token',
      value: accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });

    // Redirect to dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    );
  } catch (err) {
    console.error('Confirm error:', err);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 },
    );
  }
}
