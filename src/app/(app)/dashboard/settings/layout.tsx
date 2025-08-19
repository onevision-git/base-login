// src/app/(app)/dashboard/settings/layout.tsx
import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { isSystemAdminEmail } from '@/lib/systemAdmin';
import { getEmailFromRequest } from '@/lib/authTokens';

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Next.js 15: headers() is async
  const hdrs = await headers();
  const cookieHeader = hdrs.get('cookie') || '';

  // Reuse our cookie→email helper
  const req = new Request('http://local', {
    headers: { cookie: cookieHeader },
  });

  const email = await getEmailFromRequest(req);

  if (!isSystemAdminEmail(email)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
