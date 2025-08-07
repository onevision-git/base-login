// File: src/app/api/auth/accept-invite/route.ts

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createUserFromInvite } from '../../../../../packages/auth/src/service';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  const { token, password } = await req.json().catch(() => ({}));

  if (typeof token !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // 1. Verify invite token
  let payload: {
    email: string;
    role: 'standard' | 'admin';
    inviterId: string;
    companyId: string;
  };
  try {
    payload = jwt.verify(token, JWT_SECRET) as typeof payload;
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 },
    );
  }

  // 2. Redeem the invite (creates user or throws)
  try {
    await createUserFromInvite(token, password);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err.message || 'Could not accept invite' },
      { status: 400 },
    );
  }

  // 3. Success
  return NextResponse.json({ success: true });
}
