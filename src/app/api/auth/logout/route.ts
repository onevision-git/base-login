import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url));

  response.cookies.set({
    name: 'token',
    value: '',
    path: '/',
    httpOnly: true,
    secure: false, // ⚠️ must be false on localhost
    sameSite: 'lax',
    expires: new Date(0), // immediately expire
  });

  return response;
}
