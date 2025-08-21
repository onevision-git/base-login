// src/components/DashboardHeader.tsx
'use client';

import BaseHeader from './BaseHeader';
import LogoutButton from './LogoutButton';

export default function DashboardHeader() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'App';

  return (
    <BaseHeader
      appName={appName}
      appHref="/dashboard"
      links={[
        { href: '/dashboard', label: 'Home' },
        { href: '/dashboard/settings', label: 'Settings' },
      ]}
      right={<LogoutButton />}
    />
  );
}
