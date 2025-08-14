'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Header() {
  return (
    <header className="w-full bg-base-200 border-b border-base-300 shadow flex items-center justify-between px-6 py-3">
      {/* Left: Logo + app name */}
      <div className="flex items-center gap-2">
        <Link href="/">
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

      {/* Right: Login button */}
      <Link href="/login" className="btn btn-primary btn-sm">
        Login
      </Link>
    </header>
  );
}
