// src/app/api/health/route.ts
// Lightweight health-check endpoint: no DB calls, safe for CI/CD & monitoring.

import { APP_VERSION } from '@/lib/version';

const startedAt = Date.now();

export async function GET() {
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

  return new Response(
    JSON.stringify({
      status: 'ok',
      version: APP_VERSION,
      uptime: uptimeSeconds,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}
