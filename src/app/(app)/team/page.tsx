// File: src/app/(app)/team/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import TeamInviteForm from './TeamInviteForm';
import { connect } from '../../../lib/db';
import User from '../../../models/User';
import { getInviteInfo } from '../../../../packages/auth/src/service';

type JwtPayload = {
  userId: string;
  companyId: string;
  email?: string;
};

function getDomainFromEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  const parts = email.split('@');
  if (parts.length !== 2) return null;
  return parts[1].toLowerCase();
}

/** ---- TEMP: mock invites so we can validate UI before wiring real data ---- */
type InviteStatus = 'PENDING' | 'ACCEPTED';
type Invite = {
  id: string;
  email: string;
  status: InviteStatus;
  invitedAt: string; // ISO date
  acceptedAt?: string | null;
};

const mockInvites: Invite[] = [
  {
    id: 'inv_1',
    email: 'alice@example.com',
    status: 'PENDING',
    invitedAt: '2025-08-01T10:15:00.000Z',
  },
  {
    id: 'inv_2',
    email: 'ben@example.com',
    status: 'ACCEPTED',
    invitedAt: '2025-08-02T14:30:00.000Z',
    acceptedAt: '2025-08-03T09:05:00.000Z',
  },
  {
    id: 'inv_3',
    email: 'carol@example.com',
    status: 'PENDING',
    invitedAt: '2025-08-05T16:45:00.000Z',
  },
];

// Server Action (mock) — we’ll wire this to real resend next step
async function resendInviteAction(formData: FormData) {
  'use server';
  const inviteId = formData.get('inviteId');
  await new Promise((r) => setTimeout(r, 300)); // simulate latency
  console.log('[MOCK] Resend requested for invite:', inviteId);
}

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso! : d.toLocaleString();
}

/** ---- PAGE ---- */
export default async function TeamPage() {
  // 1) Auth via JWT cookie
  const cookieStore = await cookies(); // your setup requires await
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    redirect('/login');
  }

  // 2) Ensure DB connection (used below + by service)
  await connect();

  // 3) Invite info (counts + permission)
  const { userCount, maxUsers, canInvite } = await getInviteInfo(
    payload.companyId,
    payload.userId,
  );

  // 4) Determine inviter domain (prefer JWT email, fallback to DB)
  let inviterDomain = getDomainFromEmail(payload.email);

  if (!inviterDomain) {
    // Cast the model for this call so TS doesn't choke on overloads
    const inviterDoc = await (User as any)
      .findOne({ _id: payload.userId }, { email: 1, _id: 0 })
      .exec();

    const inviterEmail = (inviterDoc as { email?: string } | null)?.email;
    inviterDomain = getDomainFromEmail(inviterEmail) ?? '';
  }

  // 5) Render
  return (
    <main className="min-h-screen flex flex-col gap-6 p-4 bg-base-200">
      <h1 className="text-3xl font-bold">Team Invites</h1>

      <section className="rounded-lg border p-4 bg-white">
        <TeamInviteForm
          userCount={userCount}
          maxUsers={maxUsers}
          canInvite={canInvite}
          // inviterDomain will be added after we update the form props in the next step
          // inviterDomain={inviterDomain || ''}
        />
      </section>

      <section className="rounded-lg border bg-white">
        <div className="p-4">
          <h2 className="text-lg font-semibold">Existing invites</h2>
          <p className="text-sm text-gray-500">
            Lists invited emails and status. Resend is mocked for now; we’ll
            wire it up next.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Invited</th>
                <th className="px-4 py-3 font-medium text-gray-600">
                  Accepted
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {mockInvites.map((inv) => {
                const accepted = inv.status === 'ACCEPTED';
                return (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-3">{inv.email}</td>
                    <td className="px-4 py-3">
                      {accepted ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                          Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatDate(inv.invitedAt)}</td>
                    <td className="px-4 py-3">{formatDate(inv.acceptedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={resendInviteAction}>
                        <input type="hidden" name="inviteId" value={inv.id} />
                        <button
                          type="submit"
                          disabled={accepted}
                          title={
                            accepted
                              ? 'Invite already accepted'
                              : 'Resend invite email'
                          }
                          className={`rounded-md px-3 py-1.5 text-sm border transition ${
                            accepted
                              ? 'opacity-40 cursor-not-allowed'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          Resend
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
              {mockInvites.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={5}>
                    No invites yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 text-xs text-gray-500 border-t">
          “Resend” posts a server action that currently just logs. We’ll hook it
          to the real mailer next.
        </div>
      </section>
    </main>
  );
}
