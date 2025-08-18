// src/components/DashboardFooter.tsx
'use client';

import BaseFooter from './BaseFooter';

export default function DashboardFooter() {
  return (
    <BaseFooter
      variant="dashboard"
      owner="Base Login"
      note="All rights reserved."
      // links={[ { href: '/dashboard/settings', label: 'Settings' } ]}
    />
  );
}
