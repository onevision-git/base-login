// src/components/DashboardFooter.tsx
'use client';

import BaseFooter from './BaseFooter';

export default function DashboardFooter() {
  return (
    <BaseFooter
      variant="dashboard"
      // rely on BaseFooter default: NEXT_PUBLIC_ORG_NAME
      note="All rights reserved."
      // links={[ { href: '/dashboard/settings', label: 'Settings' } ]}
    />
  );
}
