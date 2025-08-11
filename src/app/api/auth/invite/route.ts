// File: src/app/api/auth/invite/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

import { getInviteInfo } from '../../../../../packages/auth/src/service';
import { sendMagicLink } from '../../../../../packages/auth/src/email';

import { connect } from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET as string;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL as string;

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
function domainOf(email: string): string {
  return email.split('@')[1]?.toLowerCase() ?? '';
}
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function POST(req: Request) {
  // 1) Authenticate
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return bad(401, 'Unauthorized');

  let payload: { userId: string; companyId: string; email: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as typeof payload;
  } catch {
    return bad(401, 'Unauthorized');
  }

  // 2) Authorisation / seat limit (ensures inviter is admin via service)
  const { canInvite } = await getInviteInfo(payload.companyId, payload.userId);
  if (!canInvite) return bad(403, 'Forbidden');

  // 3) Parse body
  const body = await req.json().catch(() => ({}) as any);
  const email: string = body?.email;
  const role: 'standard' | 'admin' = body?.role;

  if (
    !email ||
    !isValidEmail(email) ||
    (role !== 'standard' && role !== 'admin')
  ) {
    return bad(400, 'Invalid input');
  }

  const inviteeEmail = email.trim();
  const inviterEmail = payload.email;

  // 4) Domain policy — invitee must share inviter's domain
  const inviterDomain = domainOf(inviterEmail);
  const inviteeDomain = domainOf(inviteeEmail);
  if (!inviterDomain || inviterDomain !== inviteeDomain) {
    return bad(400, 'Email domain must match your company domain.');
  }

  // 5) Prevent inviting an already registered user (case-insensitive)
  try {
    await connect();
    const exists = await User.exists({
      email: { $regex: `^${escapeRegex(inviteeEmail)}$`, $options: 'i' },
    });
    if (exists) return bad(409, 'This email is already registered.');
  } catch (e) {
    console.error('Invite pre-check error:', e);
    return bad(500, 'Failed to validate invite.');
  }

  // 6) Generate invite token & send email
  try {
    const inviteToken = jwt.sign(
      {
        email: inviteeEmail,
        role,
        inviterId: payload.userId,
        companyId: payload.companyId,
      },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    const inviteLink = `${APP_URL}/accept-invite?token=${inviteToken}`;
    await sendMagicLink(inviteeEmail, inviteLink);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Invite dispatch error:', e);
    return bad(500, 'Failed to send invitation.');
  }
}
