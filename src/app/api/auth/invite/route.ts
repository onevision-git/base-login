// File: src/app/api/auth/invite/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getInviteInfo } from '../../../../../packages/auth/src/service';
import { sendMagicLink } from '../../../../../packages/auth/src/email';

const JWT_SECRET = process.env.JWT_SECRET as string;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL as string;

export async function POST(req: Request) {
  // 1. Authenticate
  const cookieStore = await cookies(); // ← add await here
  const token = cookieStore.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: { userId: string; companyId: string; email: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as typeof payload;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Authorization / limit check
  const { canInvite } = await getInviteInfo(payload.companyId, payload.userId);
  if (!canInvite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Parse & validate input
  const { email, role } = await req.json().catch(() => ({}));
  if (
    typeof email !== 'string' ||
    !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
    (role !== 'standard' && role !== 'admin')
  ) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 4. Generate invite token & send email
  const inviteToken = jwt.sign(
    { email, role, inviterId: payload.userId, companyId: payload.companyId },
    JWT_SECRET,
    { expiresIn: '24h' },
  );

  const inviteLink = `${APP_URL}/accept-invite?token=${inviteToken}`;
  await sendMagicLink(email, inviteLink);

  // 5. Success
  return NextResponse.json({ success: true });
}
