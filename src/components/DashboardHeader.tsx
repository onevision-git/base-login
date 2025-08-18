// src/components/DashboardHeader.tsx
'use client';

import Link from 'next/link';
import BaseHeader from './BaseHeader';
import LogoutButton from './LogoutButton';

export default function DashboardHeader() {
  return (
    <BaseHeader
      appName="SaaS Base Login"
      appHref="/dashboard"
      links={[
        { href: '/dashboard', label: 'Home' },
        { href: '/dashboard/settings', label: 'Settings' },
      ]}
      right={<LogoutButton />}
    />
  );
}
