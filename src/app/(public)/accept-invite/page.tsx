// File: src/app/accept-invite/page.tsx
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import AcceptInviteForm from './AcceptInviteForm';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET as string;

interface InvitePayload {
  email: string;
  role: 'standard' | 'admin';
  inviterId: string;
  companyId: string;
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token;
  if (!token) {
    // No token provided
    redirect('/login');
  }

  let payload: InvitePayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as InvitePayload;
  } catch {
    // Token invalid or expired
    redirect('/login');
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-base-200">
      <h1 className="text-3xl font-bold mb-6">Set Up Your Account</h1>
      <AcceptInviteForm
        inviteToken={token}
        email={payload.email}
        role={payload.role}
        inviterId={payload.inviterId}
        companyId={payload.companyId}
      />
    </main>
  );
}
