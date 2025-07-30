import { NextRequest, NextResponse } from 'next/server';
import { login } from '@onevision/base-login-auth';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await login(data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
