// File: src/app/api/auth/accept-invite/route.ts

import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import { connect } from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Common JSON error helper
function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

// Handle POST from the Accept Invite form
export async function POST(req: Request) {
  // Accept either application/json or form POSTs (application/x-www-form-urlencoded / multipart/form-data)
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
  let payload: {
    email: string;
    role: 'standard' | 'admin';
    inviterId: string;
    companyId: string;
    iat?: number;
    exp?: number;
  };
  try {
    payload = jwt.verify(token, JWT_SECRET) as typeof payload;
  } catch {
    return bad(400, 'Invalid or expired invite link');
  }

  const email = payload.email?.trim().toLowerCase();
  if (!email) return bad(400, 'Invite has no email');

  try {
    await connect();

    // Prevent creating a duplicate account
    const existing = await User.exists({
      email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
    });
    if (existing) {
      // If the user already exists, send them to login with a hint
      return NextResponse.redirect(new URL('/login?already=1', req.url));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Minimal user document; extra fields are ignored if not in schema.
    const doc = new (User as any)({
      email,
      passwordHash,
      role: payload.role,
      companyId: payload.companyId,
      invitedBy: payload.inviterId,
      emailVerified: true,
    });

    await doc.save();

    // Redirect to login with a success flag so UI can show a toast/message
    return NextResponse.redirect(new URL('/login?accepted=1', req.url));
  } catch (e) {
    console.error('accept-invite error:', e);
    return bad(500, 'Failed to create account from invite');
  }
}

// Small util copied from your invite route
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
