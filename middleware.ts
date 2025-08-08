// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1️⃣ Allow public routes through
  if (
    pathname === '/login' ||
    pathname === '/about' ||
    pathname === '/confirm' ||
    pathname.startsWith('/api/auth/')
  ) {
    return NextResponse.next();
  }

  // 2️⃣ Check for token
  const token = request.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3️⃣ Verify it
  try {
    jwt.verify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// catch every non-API/static route except our public ones above
export const config = {
  matcher: ['/((?!api|_next|.*\\..*|login|about|confirm).*)'],
};
