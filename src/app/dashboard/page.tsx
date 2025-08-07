// File: src/app/dashboard/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { connect } from '../../lib/db';
import { User } from '../../models/User';
import LogoutButton from '../../components/LogoutButton';

export default async function DashboardPage() {
  // 1️⃣ Read & verify the JWT from the cookie
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) {
    redirect('/login');
  }

  let payload: { email: string; userId: string };
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
      userId: string;
    };
  } catch {
    redirect('/login');
  }

  const { email, userId } = payload;

  // 2️⃣ Connect to MongoDB and load the current user's role
  await connect();
  const currentUser = await User.findById(userId).select('role').lean();
  const isAdmin = currentUser?.role === 'admin';

  // 3️⃣ Render the dashboard, showing the Invite Users link only for admins
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-4 bg-base-200">
      <h1 className="text-3xl font-bold">Welcome to your dashboard</h1>
      <p className="text-lg text-center">
        You are successfully logged in as <strong>{email}</strong>.
      </p>

      {isAdmin && (
        <Link href="/team" className="btn btn-primary">
          Invite Users
        </Link>
      )}

      <LogoutButton />
    </main>
  );
}
