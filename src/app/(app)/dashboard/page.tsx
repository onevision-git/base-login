// src/app/(app)/dashboard/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import Link from 'next/link';
import { connect } from '../../../lib/db';
import User from '../../../models/User';

export default async function DashboardPage() {
  // 1) Read & verify the JWT from the cookie (unchanged)
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

  // 2) DB + user role (unchanged)
  await connect();
  const currentUser = await User.findById(userId).select('role');
  const isAdmin = currentUser?.role === 'admin';

  // 3) Visual only: centred card to match public pages (no extra header/footer here)
  return (
    <section className="max-w-2xl mx-auto px-4 py-10">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h1 className="text-3xl font-bold">Welcome to your dashboard</h1>
          <p className="text-base-content/80">
            You are signed in as <strong>{email}</strong>.
          </p>

          <div className="mt-4">
            {isAdmin ? (
              <Link href="/team" className="btn btn-primary">
                Invite users
              </Link>
            ) : (
              <p className="text-sm opacity-70">
                If you need to invite teammates, ask your admin.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
