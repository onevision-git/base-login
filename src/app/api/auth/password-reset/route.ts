// src/app/api/auth/password-reset/route.ts
import { NextResponse } from 'next/server';

function isPlaceholderEnabled() {
  return (
    (process.env.ENABLE_PASSWORD_RESET_PLACEHOLDER || '').toLowerCase() ===
    'true'
  );
}

export async function POST(req: Request) {
  const enabled = isPlaceholderEnabled();

  // Always include a debug header so you can see what the server read.
  const baseInit: ResponseInit = {
    headers: { 'x-reset-placeholder-enabled': String(enabled) },
  };

  if (!enabled) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404, ...baseInit },
    );
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json.' },
        { status: 415, ...baseInit },
      );
    }

    const body = await req.json().catch(() => null);
    const email = body?.email?.toString().trim();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400, ...baseInit },
      );
    }

    // Placeholder behaviour
    return NextResponse.json(
      {
        message: 'Password reset is not configured in this environment.',
        received: { email },
      },
      { status: 501, ...baseInit }, // Not Implemented
    );
  } catch {
    return NextResponse.json(
      { error: 'Unexpected error.' },
      { status: 500, ...baseInit },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed.' },
    {
      status: 405,
      headers: {
        'x-reset-placeholder-enabled': String(isPlaceholderEnabled()),
      },
    },
  );
}
