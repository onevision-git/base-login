// src/components/DashboardHeader.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import LogoutButton from './LogoutButton';

export default function DashboardHeader() {
  return (
    <header className="w-full bg-base-200 border-b border-base-300 shadow flex items-center justify-between px-6 py-3">
      {/* Left: Logo + app name */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard">
          <Image
            src="/logo-placeholder.jpg"
            alt="App Logo"
            width={32}
            height={32}
            className="rounded"
          />
        </Link>
        <Link
          href="/dashboard"
          className="font-bold text-xl text-primary hover:underline"
        >
          SaaS Base Login
        </Link>
      </div>

      {/* Right: Dashboard navigation */}
      <nav>
        <ul className="flex items-center gap-4">
          <li>
            <Link href="/dashboard" className="hover:underline">
              Home
            </Link>
          </li>
          <li>
            <Link href="/dashboard/settings" className="hover:underline">
              Settings
            </Link>
          </li>
          <li>
            <LogoutButton />
          </li>
        </ul>
      </nav>
    </header>
  );
}
