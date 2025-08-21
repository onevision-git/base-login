// File: src/app/api/auth/invite/route.ts

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// ⚠️ Anything that might touch env vars (db/auth/email/models)
// is imported inside the POST handler via dynamic import(). This keeps
// Next.js builds safe and avoids top-level env reads.

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

type InviteDocShape = mongoose.Document & {
  companyId: mongoose.Types.ObjectId;
  email: string;
  status: 'PENDING' | 'ACCEPTED';
  invitedBy: mongoose.Types.ObjectId | string;
  invitedAt: Date | null;
  acceptedAt: Date | null;
  role?: 'admin' | 'standard';
};

type UserDocShape = mongoose.Document & {
  email: string;
};

type InviteRequestBody = {
  email?: string;
  role?: 'standard' | 'admin';
};

export async function POST(req: Request) {
  // 0) Runtime env reads (safe for build)
  const JWT_SECRET = process.env.JWT_SECRET;
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
  if (!JWT_SECRET || !APP_URL) {
    return bad(
      500,
      'Missing required environment variables: JWT_SECRET, NEXT_PUBLIC_APP_URL',
    );
  }

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

  // 2) Lazy-load modules that may read env at import time
  const [
    { getInviteInfo },
    { sendInviteEmail },
    { connect },
    { default: User },
    { default: Invite },
    { default: Company },
  ] = await Promise.all([
    import('../../../../../packages/auth/src/service'),
    import('../../../../../packages/auth/src/email'),
    import('@/lib/db'),
    import('@/models/User'),
    import('@/models/Invite'),
    import('@/models/Company'),
  ]);

  const InviteModel = Invite as unknown as mongoose.Model<InviteDocShape>;
  const UserModel = User as unknown as mongoose.Model<UserDocShape>;
  const CompanyModel = Company as unknown as mongoose.Model<
    mongoose.Document & { maxUsers?: number }
  >;

  // 3) Authorisation / role checks (kept as-is)
  const { canInvite } = await getInviteInfo(payload.companyId, payload.userId);
  if (!canInvite) return bad(403, 'Forbidden');

  // 4) Parse body
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

  // 5) Domain policy — invitee must share inviter's domain
  const inviterDomain = domainOf(inviterEmail);
  const inviteeDomain = domainOf(inviteeEmail);
  if (!inviterDomain || inviterDomain !== inviteeDomain) {
    return bad(400, 'Email domain must match your company domain.');
  }

  // Optional: block self-invite (nice UX guard)
  if (inviteeEmail.toLowerCase() === inviterEmail.toLowerCase()) {
    return bad(400, 'You cannot invite your own email.');
  }

  // 6) Pre-checks (connect once)
  try {
    await connect();
  } catch (err: unknown) {
    console.error('DB connect error:', err);
    return bad(500, 'Failed to validate invite.');
  }

  // 6a) Prevent inviting an already registered user (case-insensitive)
  try {
    const exists = await UserModel.exists({
      email: { $regex: `^${escapeRegex(inviteeEmail)}$`, $options: 'i' },
    });
    if (exists) return bad(409, 'This email is already registered.');
  } catch (err: unknown) {
    console.error('Invite pre-check (user exists) error:', err);
    return bad(500, 'Failed to validate invite.');
  }

  // ✅ 6b) NEW: Prevent duplicate *pending* invite for same company + email
  try {
    const existingPending = await InviteModel.exists({
      companyId: new mongoose.Types.ObjectId(payload.companyId),
      email: { $regex: `^${escapeRegex(inviteeEmail)}$`, $options: 'i' },
      status: 'PENDING',
    });
    if (existingPending) {
      return bad(409, 'An invite is already pending for this email.');
    }
  } catch (err: unknown) {
    console.error('Invite pre-check (pending exists) error:', err);
    return bad(500, 'Failed to validate invite.');
  }

  // 7) Seat-cap enforcement: users + pending invites must be < maxUsers
  try {
    const [usersCount, pendingInvites, company] = await Promise.all([
      UserModel.countDocuments({
        companyId: new mongoose.Types.ObjectId(payload.companyId),
      }).exec(),
      InviteModel.countDocuments({
        companyId: new mongoose.Types.ObjectId(payload.companyId),
        status: { $ne: 'ACCEPTED' },
      }).exec(),
      CompanyModel.findById(new mongoose.Types.ObjectId(payload.companyId))
        .select('maxUsers')
        .lean()
        .exec(),
    ]);

    const max = Number(company?.maxUsers ?? 0);
    if (!(max > 0)) {
      return bad(400, 'User limit reached for this company');
    }

    if (usersCount + pendingInvites >= max) {
      return bad(400, 'User limit reached for this company');
    }
  } catch (err: unknown) {
    console.error('Seat-cap check error:', err);
    return bad(500, 'Failed to validate seat availability.');
  }

  // 8) Generate invite token & send email
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

    await sendInviteEmail({
      to: inviteeEmail,
      token: inviteToken,
      inviterEmail,
    });

    // 9) Persist the invite (non-fatal if this fails; the email has been sent)
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
    } catch (err: unknown) {
      console.error('[invite] create error:', err);
      // Swallow: we already sent the email; admin can resend if needed
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('Invite dispatch error:', err);
    return bad(500, 'Failed to send invitation.');
  }
}
