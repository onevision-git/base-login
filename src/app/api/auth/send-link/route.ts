import { NextRequest, NextResponse } from 'next/server';
import { sendLoginLink } from '@onevision/base-login-auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    await sendLoginLink(email);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
