// src/components/Header.tsx
'use client';

import Link from 'next/link';
import BaseHeader from './BaseHeader';

export default function Header() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'App';

  return (
    <BaseHeader
      appName={appName}
      appHref="/"
      right={
        <Link href="/login" className="btn btn-primary btn-sm">
          Login
        </Link>
      }
    />
  );
}
