// File: src/app/api/auth/delete-invite/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';

import { connect } from '@/lib/db';
import Invite from '@/models/Invite';
import User from '@/models/User';

type JwtPayload = {
  userId: string;
  companyId: string;
  role?: 'admin' | 'standard';
};

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  try {
    // 1) Auth
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return bad(401, 'Not authenticated');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch {
      return bad(401, 'Invalid token');
    }

    await connect();

    // 2) Ensure requester is an admin in this company
    const requester = await User.findOne(
      { _id: payload.userId, companyId: payload.companyId },
      { _id: 1, role: 1 },
    )
      .lean<{ _id: Types.ObjectId; role: 'admin' | 'standard' }>()
      .exec();

    if (!requester) return bad(403, 'Not allowed.');
    if (requester.role !== 'admin')
      return bad(403, 'Only admins can delete invites.');

    // 3) Parse and validate body
    const { inviteId } = (await req.json()) as { inviteId?: string };
    if (!inviteId || !mongoose.isValidObjectId(inviteId)) {
      return bad(400, 'A valid inviteId is required.');
    }

    // 4) Company-scoped delete (works for pending or accepted invites)
    const result = await Invite.deleteOne({
      _id: new Types.ObjectId(inviteId),
      companyId: new Types.ObjectId(payload.companyId),
    }).exec();

    if (result.deletedCount === 0) {
      return bad(404, 'Invite not found.');
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete invite error:', err);
    return bad(500, 'Unexpected server error.');
  }
}
