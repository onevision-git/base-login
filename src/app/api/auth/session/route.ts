// File: src/app/api/auth/session/route.ts
import { NextResponse } from 'next/server';
import { verifyJwtAndUser, getTokenFromRequest } from '@/lib/authTokens';

export async function GET(req: Request) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const result = await verifyJwtAndUser(token);
  if (!result.ok) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { user } = result;
  // Return minimal identity for the client
  return NextResponse.json({
    user: {
      id: user._id.toString(),
      email: user.email,
      companyId: user.companyId?.toString?.() ?? null,
      role: user.role,
    },
  });
}
