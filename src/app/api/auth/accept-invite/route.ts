// File: src/app/api/auth/accept-invite/route.ts

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { connect } from '@/lib/db';
import User from '@/models/User';
import Invite from '@/models/Invite';
import Company from '@/models/Company';
import { sendAdminInviteAcceptedAlert } from '@/lib/adminAlerts'; // ⟵ NEW

// Common JSON error helper
function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

// Types for JWT payload from invite link
type InviteJwtPayload = {
  email: string;
  role: 'standard' | 'admin';
  inviterId: string;
  companyId: string;
  iat?: number;
  exp?: number;
};

// Minimal shapes we write/read in this route
type MinimalUserDoc = mongoose.Document & {
  email: string;
  passwordHash: string;
  role: 'standard' | 'admin';
  companyId: mongoose.Types.ObjectId;
  invitedBy?: string;
  emailVerified: boolean;
};

type MinimalInviteDoc = mongoose.Document & {
  companyId: mongoose.Types.ObjectId;
  email: string;
  status?: 'PENDING' | 'ACCEPTED';
  invitedAt?: Date | null;
  acceptedAt?: Date | null;
  role?: 'admin' | 'standard';
};

// Strongly-typed models based on the minimal shapes we touch here
const UserModel = User as unknown as mongoose.Model<MinimalUserDoc>;
const InviteModel = Invite as unknown as mongoose.Model<MinimalInviteDoc>;
const CompanyModel = Company as unknown as mongoose.Model<
  mongoose.Document & { maxUsers?: number }
>;

// Handle POST from the Accept Invite form
export async function POST(req: Request) {
  // Load env var at runtime
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET');
  }

  // Accept either application/json or form POSTs
  let token: string | null = null;
  let password: string | null = null;
  let confirm: string | null = null;

  const ctype = req.headers.get('content-type') || '';
  try {
    if (ctype.includes('application/json')) {
      const body = await req.json();
      token = (body?.token ?? '').toString();
      password = (body?.password ?? '').toString();
      confirm = (body?.confirm ?? '').toString();
    } else {
      const form = await req.formData();
      token = (form.get('token') ?? '').toString();
      password = (form.get('password') ?? '').toString();
      confirm = (form.get('confirm') ?? '').toString();
    }
  } catch {
    return bad(400, 'Invalid request');
  }

  if (!token) return bad(400, 'Missing token');
  if (!password || password.length < 8)
    return bad(400, 'Password must be at least 8 characters');
  if (password !== confirm) return bad(400, 'Passwords do not match');

  // Verify invite token (expiry, signature)
  let payload: InviteJwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as InviteJwtPayload;
  } catch {
    return bad(400, 'Invalid or expired invite link');
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email) return bad(400, 'Invite has no email');

  try {
    await connect();

    // 1) Ensure there is a PENDING invite in DB for this company+email
    const invite = await InviteModel.findOne(
      {
        companyId: new mongoose.Types.ObjectId(payload.companyId),
        email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
        status: { $ne: 'ACCEPTED' },
      },
      { role: 1, invitedAt: 1, status: 1 },
    )
      .lean()
      .exec();

    if (!invite) {
      return bad(400, 'Invite not found or already accepted');
    }

    // 2) If the user already exists, mark invite accepted and redirect
    const existing = await UserModel.exists({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
      companyId: new mongoose.Types.ObjectId(payload.companyId),
    });

    if (existing) {
      await markLatestInviteAccepted(payload.companyId, email);
      // Optional admin alert even on already-existing user acceptance
      try {
        const inviterEmail = await tryGetInviterEmail(payload.inviterId);
        await sendAdminInviteAcceptedAlert({
          inviteeEmail: email,
          inviterEmail,
          appUrl: process.env.NEXT_PUBLIC_APP_URL ?? undefined,
        });
      } catch (e) {
        console.error(
          'Admin alert (invite accepted, existing user) failed:',
          e,
        );
      }
      return NextResponse.redirect(new URL('/login?already=1', req.url));
    }

    // 3) Seat-cap enforcement at accept time (defensive)
    const [company, userCount] = await Promise.all([
      CompanyModel.findById(new mongoose.Types.ObjectId(payload.companyId))
        .select('maxUsers')
        .lean()
        .exec(),
      UserModel.countDocuments({
        companyId: new mongoose.Types.ObjectId(payload.companyId),
      }).exec(),
    ]);

    const max = Number(company?.maxUsers ?? 0);
    if (!(max > 0)) {
      return bad(400, 'User limit reached for this company');
    }
    if (userCount >= max) {
      return bad(400, 'User limit reached for this company');
    }

    // 4) Create the new user
    const passwordHash = await bcrypt.hash(password, 10);

    const role: 'admin' | 'standard' =
      (invite.role as 'admin' | 'standard' | undefined) ??
      payload.role ??
      'standard';

    const doc = new UserModel({
      email,
      passwordHash,
      role,
      companyId: new mongoose.Types.ObjectId(payload.companyId),
      invitedBy: payload.inviterId,
      emailVerified: true,
    });

    await doc.save();

    // 5) Mark the invite as accepted
    await markLatestInviteAccepted(payload.companyId, email);

    // 6) === Admin alert: invite accepted ===
    // Fire-and-log; do not block redirect if email fails.
    try {
      const inviterEmail = await tryGetInviterEmail(payload.inviterId);
      await sendAdminInviteAcceptedAlert({
        inviteeEmail: email,
        inviterEmail,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? undefined,
      });
    } catch (e) {
      console.error('Admin alert (invite accepted) failed:', e);
    }

    return NextResponse.redirect(new URL('/login?accepted=1', req.url));
  } catch (e) {
    console.error('accept-invite error:', e);
    return bad(500, 'Failed to create account from invite');
  }
}

async function markLatestInviteAccepted(
  companyId: string,
  email: string,
): Promise<void> {
  try {
    await InviteModel.findOneAndUpdate(
      {
        companyId: new mongoose.Types.ObjectId(companyId),
        email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
        status: { $ne: 'ACCEPTED' },
      },
      { $set: { status: 'ACCEPTED', acceptedAt: new Date() } },
      { sort: { invitedAt: -1 } },
    ).exec();
  } catch (e) {
    console.error('accept-invite: failed to mark invite accepted:', e);
  }
}

// Best-effort lookup of inviter's email (optional)
async function tryGetInviterEmail(
  inviterId?: string,
): Promise<string | undefined> {
  if (!inviterId) return undefined;
  try {
    const row = await UserModel.findById(new mongoose.Types.ObjectId(inviterId))
      .select('email')
      .lean()
      .exec();
    const email = (row as { email?: string } | null)?.email?.trim();
    return email || undefined;
  } catch {
    return undefined;
  }
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
