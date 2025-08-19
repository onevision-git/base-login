// File: src/app/(app)/team/page.tsx
export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import mongoose, { Model, Types } from 'mongoose';

import TeamInviteForm from './TeamInviteForm';
import ResendInviteButton from './ResendInviteButton';
import DeleteMemberButton from './DeleteMemberButton';

import { connect } from '../../../lib/db';
import User from '../../../models/User';
import Invite from '../../../models/Invite';
import { getInviteInfo } from '../../../../packages/auth/src/service';

type JwtPayload = {
  userId: string;
  companyId: string;
  email?: string;
};

type InviteStatus = 'PENDING' | 'ACCEPTED';

type UiInvite = {
  id: string;
  email: string;
  status: InviteStatus; // only 'PENDING' for this table
  invitedAt: string | null;
};

type UiUser = {
  id: string;
  email: string;
  role: 'admin' | 'standard';
  createdAt: string | null;
};

type UserLean = {
  _id: Types.ObjectId;
  email: string;
  role: 'admin' | 'standard';
  createdAt?: Date | null;
};

type InviteLean = {
  _id: Types.ObjectId;
  email: string;
  invitedAt?: Date | null;
  status?: InviteStatus;
};

function fmt(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso! : d.toLocaleString();
}

export default async function TeamPage() {
  // --- Auth ---
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
  const companyObjectId = new mongoose.Types.ObjectId(payload.companyId);

  // --- Seat info (for Invite form banner) ---
  const { userCount, maxUsers, canInvite } = await getInviteInfo(
    payload.companyId,
    payload.userId,
  );

  // --- Load USERS (includes the current admin) ---
  const userModel = User as unknown as Model<UserLean>;
  const dbUsers = await userModel
    .find({ companyId: companyObjectId }, { email: 1, role: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean<UserLean[]>()
    .exec();

  const users: UiUser[] = (dbUsers ?? []).map((u) => ({
    id: String(u._id),
    email: String(u.email || ''),
    role: u.role,
    createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
  }));

  // --- Load PENDING INVITES only ---
  const inviteModel = Invite as unknown as Model<InviteLean>;
  const dbInvites = await inviteModel
    .find(
      { companyId: companyObjectId, status: 'PENDING' },
      { email: 1, invitedAt: 1, status: 1 },
    )
    .sort({ invitedAt: -1 })
    .lean<InviteLean[]>()
    .exec();

  const invites: UiInvite[] = (dbInvites ?? []).map((inv) => ({
    id: String(inv._id),
    email: String(inv.email || ''),
    status: 'PENDING',
    invitedAt: inv.invitedAt ? new Date(inv.invitedAt).toISOString() : null,
  }));

  const currentEmail = (payload.email || '').toLowerCase();

  return (
    <main className="px-4 py-10">
      <section className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-base-content/70 mt-1">
            Invite teammates, manage users, and control access.
          </p>
        </header>

        {/* Invite form */}
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
              />
            </div>
          </div>
        </div>

        {/* USERS table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Users</h2>
            <p className="text-sm opacity-70">
              All accepted users in your company (including you).
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = u.email.toLowerCase() === currentEmail;
                    return (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>
                          <span
                            className={
                              u.role === 'admin'
                                ? 'badge badge-primary badge-outline'
                                : 'badge badge-neutral badge-outline'
                            }
                          >
                            {u.role === 'admin' ? 'Admin' : 'Standard'}
                          </span>
                        </td>
                        <td>{fmt(u.createdAt)}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Delete user */}
                            <div
                              className="tooltip"
                              data-tip={
                                isSelf
                                  ? 'Cannot delete yourself'
                                  : 'Delete user'
                              }
                            >
                              <DeleteMemberButton
                                inviteId=""
                                email={u.email}
                                status="ACCEPTED"
                                disabled={isSelf}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td className="text-base-content/60" colSpan={4}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <p className="text-xs opacity-70 mt-3">
                You can’t delete your own account here. Ask another admin to
                remove you if needed.
              </p>
            </div>
          </div>
        </div>

        {/* PENDING INVITES table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Pending invites</h2>
            <p className="text-sm opacity-70">
              Resend sends a new 24h link; Delete removes the invite.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Invited</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.email}</td>
                      <td>
                        <span className="badge badge-warning badge-outline">
                          Pending
                        </span>
                      </td>
                      <td>{fmt(inv.invitedAt)}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Resend */}
                          <div className="tooltip" data-tip="Resend invite">
                            <ResendInviteButton
                              inviteId={inv.id}
                              disabled={false}
                            />
                          </div>
                          {/* Delete */}
                          <div className="tooltip" data-tip="Delete invite">
                            <DeleteMemberButton
                              inviteId={inv.id}
                              email={inv.email}
                              status="PENDING"
                              disabled={false}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invites.length === 0 && (
                    <tr>
                      <td className="text-base-content/60" colSpan={4}>
                        No pending invites.
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
