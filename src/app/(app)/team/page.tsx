// File: src/app/(app)/team/page.tsx

export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import TeamInviteForm from './TeamInviteForm';
import ResendInviteButton from './ResendInviteButton';
import { connect } from '../../../lib/db';
import User from '../../../models/User';
import Invite from '../../../models/Invite';
import mongoose from 'mongoose';
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

type InviteStatus = 'PENDING' | 'ACCEPTED';

type UiInvite = {
  id: string;
  email: string;
  status: InviteStatus;
  invitedAt: string | null;
  acceptedAt: string | null;
};

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso! : d.toLocaleString();
}

function normaliseStatus(raw?: string | null): InviteStatus {
  const s = (raw ?? '').toString().trim().toUpperCase();
  return s === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING';
}

// Narrow types we need from Mongo
type UserEmailOnly = { email?: string } | null;

type InviteLean = {
  _id: mongoose.Types.ObjectId;
  email: string;
  status?: string | null;
  invitedAt?: Date | null;
  acceptedAt?: Date | null;
};

export default async function TeamPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let payload: JwtPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    redirect('/login');
  }

  await connect();

  const { userCount, maxUsers, canInvite } = await getInviteInfo(
    payload.companyId,
    payload.userId,
  );

  // Kept for future domain‑match UI (currently not passed to the form)
  let inviterDomain = getDomainFromEmail(payload.email);
  if (!inviterDomain) {
    const inviterDoc = await (
      User as unknown as mongoose.Model<{ email?: string }>
    )
      .findOne({ _id: payload.userId }, { email: 1, _id: 0 })
      .lean<{ email?: string }>()
      .exec();

    const inviterEmail = (inviterDoc as UserEmailOnly)?.email;
    inviterDomain = getDomainFromEmail(inviterEmail) ?? '';
  }

  const companyObjectId = new mongoose.Types.ObjectId(payload.companyId);

  const inviteModel = Invite as unknown as mongoose.Model<InviteLean>;

  const dbInvites = await inviteModel
    .find(
      { companyId: companyObjectId },
      { email: 1, status: 1, invitedAt: 1, acceptedAt: 1 },
    )
    .sort({ invitedAt: -1 })
    .lean()
    .exec();

  const invites: UiInvite[] = (dbInvites ?? []).map((inv) => ({
    id: inv._id?.toString?.() ?? '',
    email: inv.email ?? '',
    status: normaliseStatus(inv.status ?? undefined),
    invitedAt: inv.invitedAt ? new Date(inv.invitedAt).toISOString() : null,
    acceptedAt: inv.acceptedAt ? new Date(inv.acceptedAt).toISOString() : null,
  }));

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
            Lists invited emails and status. Resend now calls the API and
            refreshes the table.
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
              {invites.map((inv) => {
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
                      <ResendInviteButton
                        inviteId={inv.id}
                        disabled={accepted}
                      />
                    </td>
                  </tr>
                );
              })}
              {invites.length === 0 && (
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
          Resend sends a new 24h link and bumps “Invited” to now.
        </div>
      </section>
    </main>
  );
}
