// File: src/app/api/auth/invite/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { getInviteInfo } from '../../../../../packages/auth/src/service';
import { sendMagicLink } from '../../../../../packages/auth/src/email';

import { connect } from '@/lib/db';
import User from '@/models/User';
import Invite from '@/models/Invite';

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

// Narrow types we read/write on Invite in this route
type InviteDocShape = mongoose.Document & {
  companyId: mongoose.Types.ObjectId;
  email: string;
  status: 'PENDING' | 'ACCEPTED';
  invitedBy: mongoose.Types.ObjectId | string;
  invitedAt: Date | null;
  acceptedAt: Date | null;
  role?: 'admin' | 'standard';
};
const InviteModel = Invite as unknown as mongoose.Model<InviteDocShape>;

type InviteRequestBody = {
  email?: string;
  role?: 'standard' | 'admin';
};

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

  // 2) Authorisation / seat limit
  const { canInvite } = await getInviteInfo(payload.companyId, payload.userId);
  if (!canInvite) return bad(403, 'Forbidden');

  // 3) Parse body (no 'any')
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const { email, role } = (body ?? {}) as InviteRequestBody;

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

    // 7) Persist the invite so /team can list it
    try {
      await InviteModel.create({
        companyId: new mongoose.Types.ObjectId(payload.companyId),
        email: inviteeEmail,
        status: 'PENDING',
        invitedBy: new mongoose.Types.ObjectId(payload.userId),
        invitedAt: new Date(),
        acceptedAt: null,
        role,
      });
    } catch (e) {
      console.error('[invite] create error:', e);
      // Non-fatal: email already sent; UI will still function
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Invite dispatch error:', e);
    return bad(500, 'Failed to send invitation.');
  }
}
