'use client';

import LogoutButton from './LogoutButton';
import Link from 'next/link';

export default function Header() {
  return (
    <header
      style={{ border: '4px dashed red' }}
      className="w-full bg-base-200 border-b border-base-300 shadow flex items-center justify-between px-6 py-3"
    >
      {/* Left: Logo or app name */}
      <Link
        href="/dashboard"
        className="font-bold text-xl text-primary hover:underline"
      >
        SaaS Base App - Public Header
      </Link>
    </header>
  );
}
