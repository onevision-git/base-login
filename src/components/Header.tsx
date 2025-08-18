// src/components/Header.tsx
'use client';

import Link from 'next/link';
import BaseHeader from './BaseHeader';

export default function Header() {
  return (
    <BaseHeader
      appName="SaaS Base Login"
      appHref="/"
      right={
        <Link href="/login" className="btn btn-primary btn-sm">
          Login
        </Link>
      }
    />
  );
}
