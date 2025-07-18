// src/app/api/health/route.ts
import type { NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
// Stubbed health-check so CI/build won’t need a real MongoDB URI

  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
