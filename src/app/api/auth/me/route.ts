import { NextRequest, NextResponse } from 'next/server';
import { getMe } from '@onevision/base-login-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/, '');
    const user = await getMe(token);
    return NextResponse.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
