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
  role: string; // derived from User collection
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

function formatRole(raw?: string | null): string {
  const s = (raw ?? '').toString().trim();
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); // admin -> Admin
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

type UserRoleLean = {
  _id: mongoose.Types.ObjectId;
  email?: string | null;
  role?: string | null;
  companyId?: mongoose.Types.ObjectId | string | null;
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

  // Kept for future domain-match UI (currently not passed to the form)
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

  // 1) Load invites for this company
  const dbInvites = await inviteModel
    .find(
      { companyId: companyObjectId },
      { email: 1, status: 1, invitedAt: 1, acceptedAt: 1 },
    )
    .sort({ invitedAt: -1 })
    .lean()
    .exec();

  // 2) Build a set of invite emails and fetch matching users (for roles)
  const inviteEmails = Array.from(
    new Set(
      (dbInvites ?? [])
        .map((i) => (i.email || '').toLowerCase())
        .filter(Boolean),
    ),
  );

  let usersByEmail = new Map<string, string>();
  if (inviteEmails.length > 0) {
    const userModel = User as unknown as mongoose.Model<UserRoleLean>;
    const dbUsers = await userModel
      .find(
        { companyId: companyObjectId, email: { $in: inviteEmails } },
        { email: 1, role: 1 },
      )
      .lean()
      .exec();

    usersByEmail = new Map(
      (dbUsers ?? []).map((u) => [
        String(u.email || '').toLowerCase(),
        String(u.role || ''),
      ]),
    );
  }

  // 3) Map invites to UI rows, deriving role from the matched user (if any)
  const invites: UiInvite[] = (dbInvites ?? []).map((inv) => {
    const roleRaw = usersByEmail.get((inv.email || '').toLowerCase()) || '';
    return {
      id: inv._id?.toString?.() ?? '',
      email: inv.email ?? '',
      role: formatRole(roleRaw),
      status: normaliseStatus(inv.status ?? undefined),
      invitedAt: inv.invitedAt ? new Date(inv.invitedAt).toISOString() : null,
      acceptedAt: inv.acceptedAt
        ? new Date(inv.acceptedAt).toISOString()
        : null,
    };
  });

  // === Visual only: match the centred card style used elsewhere ===
  return (
    <main className="px-4 py-10">
      <section className="max-w-4xl mx-auto space-y-8">
        {/* Title */}
        <header className="text-center">
          <h1 className="text-3xl font-bold">Team invites</h1>
          <p className="text-base-content/70 mt-1">
            Invite teammates and manage pending invites.
          </p>
        </header>

        {/* Invite form card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Invite a teammate</h2>
            <p className="text-sm opacity-70">
              You’re using {userCount} of {maxUsers} seats.
            </p>

            <div className="mt-2">
              <TeamInviteForm
                userCount={userCount}
                maxUsers={maxUsers}
                canInvite={canInvite}
                // inviterDomain will be added after we update the form props in a later step
                // inviterDomain={inviterDomain || ''}
              />
            </div>
          </div>
        </div>

        {/* Invites table card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Existing invites</h2>
            <p className="text-sm opacity-70">
              Lists invited emails and status. Resend sends a new 24h link and
              updates “Invited” to now.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Invited</th>
                    <th>Accepted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => {
                    const accepted = inv.status === 'ACCEPTED';
                    return (
                      <tr key={inv.id}>
                        <td>{inv.email}</td>
                        <td>{inv.role}</td>
                        <td>
                          {accepted ? (
                            <span className="badge badge-success badge-outline">
                              Accepted
                            </span>
                          ) : (
                            <span className="badge badge-warning badge-outline">
                              Pending
                            </span>
                          )}
                        </td>
                        <td>{formatDate(inv.invitedAt)}</td>
                        <td>{formatDate(inv.acceptedAt)}</td>
                        <td className="text-right">
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
                      <td className="text-base-content/60" colSpan={6}>
                        No invites yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
