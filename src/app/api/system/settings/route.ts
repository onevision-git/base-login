// src/app/api/system/settings/route.ts

import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/models/Settings';
import { isSystemAdminEmail } from '@/lib/systemAdmin';
import { getEmailFromRequest } from '@/lib/authTokens';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function getDevHeaderEmail(req: Request): string | null {
  const h = req.headers.get('x-user-email');
  return h ? h.trim().toLowerCase() : null;
}

function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function getRequesterEmail(req: Request): Promise<string | null> {
  const sessionEmail = await getEmailFromRequest(req);
  if (sessionEmail) return sessionEmail;
  return getDevHeaderEmail(req);
}

export async function GET(req: Request) {
  const email = await getRequesterEmail(req);
  if (!isSystemAdminEmail(email)) return forbidden('System admin only');

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

type PutBody = {
  defaultInviteUsers?: number;
};

export async function PUT(req: Request) {
  const email = await getRequesterEmail(req);
  if (!isSystemAdminEmail(email)) return forbidden('System admin only');

  let body: PutBody;
  try {
    body = (await req.json()) as PutBody;
  } catch {
    return badRequest('Invalid JSON body');
  }

  const patch: Record<string, unknown> = {};

  if (body.defaultInviteUsers !== undefined) {
    const n = Number(body.defaultInviteUsers);
    if (!Number.isInteger(n) || n < 0 || n > 1000) {
      return badRequest(
        'defaultInviteUsers must be an integer between 0 and 1000',
      );
    }
    patch.defaultInviteUsers = n;
  }

  patch.updatedBy = email || undefined;

  const updated = await updateSettings(patch);
  return NextResponse.json({ settings: updated });
}
