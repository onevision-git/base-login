import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { User } from '@auth/models/User';
import { Company } from '@auth/models/Company';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET!;

export async function GET() {
  try {
    const token = (await cookies()).get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let payload: { userId: string; companyId: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        companyId: string;
      };
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      );
    }

    await mongoose.connect(process.env.MONGODB_URI!);

    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const company = await Company.findById(payload.companyId);

    const userCount = await User.countDocuments({
      companyId: payload.companyId,
    });

    return NextResponse.json({
      user,
      company,
      userCount,
    });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
