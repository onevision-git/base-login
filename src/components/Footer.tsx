// src/components/Footer.tsx
'use client';

import BaseFooter from './BaseFooter';

export default function Footer() {
  return (
    <BaseFooter
      variant="public"
      owner="Base Login"
      note="All rights reserved."
      // links={[
      //   { href: '/privacy', label: 'Privacy' },
      //   { href: '/terms', label: 'Terms' },
      // ]}
    />
  );
}
