// File: src/app/api/auth/user-exists/route.ts

import { NextResponse } from 'next/server';
import { connect } from '@/lib/db';
import User from '@/models/User';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // never cache
export const revalidate = 0;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * GET /api/auth/user-exists?email=<email>
 * Returns: { exists: boolean }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) return badRequest('Missing "email" query parameter.');

  // Lightweight normalisation; keep comparison case-insensitive.
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return badRequest('Invalid email format.');
  }

  try {
    await connect();

    // Case-insensitive match against unique emails already stored
    const exists = await User.exists({
      email: { $regex: `^${escapeRegex(trimmed)}$`, $options: 'i' },
    });

    return NextResponse.json({ exists: !!exists }, { status: 200 });
  } catch (err) {
    console.error('user-exists error:', err);
    return NextResponse.json(
      { error: 'Failed to check user existence.' },
      { status: 500 },
    );
  }
}

function escapeRegex(input: string) {
  // Escape RegExp special chars to avoid unintended patterns
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
