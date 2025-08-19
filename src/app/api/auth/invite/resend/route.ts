// File: src/app/api/auth/invite/resend/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import { connect } from '@/lib/db';
import Invite from '@/models/Invite';
import { getInviteInfo } from '../../../../../../packages/auth/src/service';
import { sendInviteEmail } from '../../../../../../packages/auth/src/email';

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

// Minimal shape we read/write from the Invite model here
type InviteLean = {
  _id: mongoose.Types.ObjectId;
  companyId: mongoose.Types.ObjectId;
  email: string;
  status?: 'PENDING' | 'ACCEPTED' | string | null;
  role?: 'admin' | 'standard' | string | null;
  invitedAt?: Date | null;
  acceptedAt?: Date | null;
};

// Strongly typed model
const InviteModel = Invite as unknown as mongoose.Model<InviteLean>;

export async function POST(req: Request) {
  // Load env vars at runtime, not import time
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  // 1) Auth
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return bad(401, 'Unauthorized');

  let payload: { userId: string; companyId: string; email: string };
  try {
    payload = jwt.verify(token, JWT_SECRET) as typeof payload;
  } catch {
    return bad(401, 'Unauthorized');
  }

  // 2) Authorisation (must be admin and under seat limit to manage invites)
  const { canInvite } = await getInviteInfo(payload.companyId, payload.userId);
  if (!canInvite) return bad(403, 'Forbidden');

  // 3) Parse
  let body: { inviteId?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* ignore */
  }
  const inviteId = body?.inviteId?.trim();
  if (!inviteId || !mongoose.isValidObjectId(inviteId)) {
    return bad(400, 'Invalid inviteId');
  }

  await connect();

  // 4) Load invite and verify tenancy
  const invite = await InviteModel.findOne(
    {
      _id: new mongoose.Types.ObjectId(inviteId),
      companyId: new mongoose.Types.ObjectId(payload.companyId),
    },
    { email: 1, status: 1, role: 1 },
  )
    .lean<InviteLean>()
    .exec();

  if (!invite) return bad(404, 'Invite not found');
  const status = String(invite.status || '').toUpperCase();
  if (status === 'ACCEPTED') {
    return bad(409, 'Invite already accepted');
  }

  // 5) Generate fresh token (include role if present on Invite) and resend
  try {
    const inviteToken = jwt.sign(
      {
        email: invite.email,
        companyId: payload.companyId,
        inviterId: payload.userId,
        ...(invite.role ? { role: invite.role } : {}),
      },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    // Use same template/copy as the first invite, including inviter line.
    await sendInviteEmail({
      to: invite.email,
      token: inviteToken,
      inviterEmail: payload.email, // "<email> has invited you to sign-up to Base Login"
      // companyName: 'Base Login', // optional: include to brand the subject
    });

    // 6) Bump invitedAt so UI shows recent resend time
    await InviteModel.updateOne(
      { _id: new mongoose.Types.ObjectId(inviteId) },
      { $set: { invitedAt: new Date() } },
    ).exec();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[invite/resend] error:', err);
    return bad(500, 'Failed to resend invite');
  }
}
