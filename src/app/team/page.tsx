// File: src/app/team/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import TeamInviteForm from './TeamInviteForm';
import { connect } from '../../lib/db';
import { UserModel, CompanyModel } from '../../models';
import { getInviteInfo } from '../../../packages/auth/src/service';

export default async function TeamPage() {
  // 1. JWT guard (identical to dashboard)
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) redirect('/login');

  let payload: { userId: string; companyId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      companyId: string;
    };
  } catch {
    redirect('/login');
  }

  // 2. Connect to DB
  await connect();

  // 3. Load invite info via shared service
  //    This abstracts counting users and reading maxUsers
  const { userCount, maxUsers, canInvite } = await getInviteInfo(
    payload.companyId,
    payload.userId,
  );

  // 4. Render client form with props
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-base-200">
      <h1 className="text-3xl font-bold">Team Invites</h1>
      <TeamInviteForm
        userCount={userCount}
        maxUsers={maxUsers}
        canInvite={canInvite}
      />
    </main>
  );
}
