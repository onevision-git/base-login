import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Remove access_token cookie
    (await cookies()).set({
      name: 'access_token',
      value: '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 0, // expires immediately
    });

    return NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 },
    );
  } catch (err) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
