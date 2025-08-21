// src/components/Footer.tsx
'use client';

import BaseFooter from './BaseFooter';

export default function Footer() {
  return (
    <BaseFooter
      variant="public"
      // rely on BaseFooter default: NEXT_PUBLIC_ORG_NAME
      note="All rights reserved."
      // links={[
      //   { href: '/privacy', label: 'Privacy' },
      //   { href: '/terms', label: 'Terms' },
      // ]}
    />
  );
}
