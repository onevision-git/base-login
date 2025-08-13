// File: src/app/api/auth/accept-invite/route.ts

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

import { connect } from '@/lib/db';
import User from '@/models/User';
import Invite from '@/models/Invite';

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
};

// Strongly-typed models based on the minimal shapes we touch here
const UserModel = User as unknown as mongoose.Model<MinimalUserDoc>;
const InviteModel = Invite as unknown as mongoose.Model<MinimalInviteDoc>;

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

  // Verify invite token
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

    const existing = await User.exists({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
    });

    if (existing) {
      await markLatestInviteAccepted(payload.companyId, email);
      return NextResponse.redirect(new URL('/login?already=1', req.url));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const doc = new UserModel({
      email,
      passwordHash,
      role: payload.role,
      companyId: new mongoose.Types.ObjectId(payload.companyId),
      invitedBy: payload.inviterId,
      emailVerified: true,
    });

    await doc.save();
    await markLatestInviteAccepted(payload.companyId, email);

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

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
