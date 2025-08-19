// File: src/app/api/auth/delete-user/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose, { Types } from 'mongoose';
import { connect } from '@/lib/db';
import User from '@/models/User';
import Invite from '@/models/Invite';

type JwtPayload = {
  userId: string;
  companyId: string;
};

type UserLean = {
  _id: Types.ObjectId;
  role: 'admin' | 'standard';
  email: string;
};

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(req: Request) {
  try {
    // 1) AuthN
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

    // 2) Parse body: allow userId or email
    const body = (await req.json()) as { userId?: string; email?: string };
    const { userId, email } = body || {};
    if (!userId && !email) {
      return bad(400, 'Provide userId or email.');
    }

    // 3) Load requester & ensure admin
    const requester = await User.findOne(
      { _id: payload.userId, companyId: payload.companyId },
      { _id: 1, role: 1 },
    )
      .lean<{ _id: Types.ObjectId; role: 'admin' | 'standard' }>()
      .exec();

    if (!requester) return bad(403, 'Not allowed.');
    if (requester.role !== 'admin')
      return bad(403, 'Only admins can delete users.');

    // 4) Find the target user within same company
    const companyId = new Types.ObjectId(payload.companyId);
    const query: Record<string, unknown> = { companyId };

    if (userId) {
      if (!mongoose.isValidObjectId(userId)) return bad(400, 'Invalid userId.');
      query._id = new Types.ObjectId(userId);
    } else if (email) {
      query.email = String(email).toLowerCase();
    }

    const target = await User.findOne(query, { _id: 1, role: 1, email: 1 })
      .lean<UserLean | null>()
      .exec();

    if (!target) return bad(404, 'User not found in your company.');

    // 5) Prevent self-delete via this endpoint
    if (String(target._id) === String(payload.userId)) {
      return bad(400, 'You cannot delete your own account here.');
    }

    // 6) Protect last admin
    if (target.role === 'admin') {
      const adminCount = await User.countDocuments({
        companyId,
        role: 'admin',
      }).exec();
      if (adminCount <= 1) {
        return bad(400, 'You cannot delete the last remaining admin.');
      }
    }

    // 7) Delete user
    await User.deleteOne({ _id: target._id, companyId }).exec();

    // 8) Also delete any invites for this email in this company
    const targetEmail = String(target.email || '').toLowerCase();
    if (targetEmail) {
      await Invite.deleteMany({ companyId, email: targetEmail }).exec();
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return bad(500, 'Unexpected server error.');
  }
}
