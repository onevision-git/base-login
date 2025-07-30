import { NextRequest, NextResponse } from 'next/server';
import { signUp } from '@onevision/base-login-auth';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await signUp(data);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
