import { NextResponse } from 'next/server';

export async function POST() {
  // Stateless JWT logout is a no-op; client should discard token
  return NextResponse.json({ success: true });
}
