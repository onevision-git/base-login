// src/components/BaseHeader.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

type NavLink = {
  href: string;
  label: string;
};

type BaseHeaderProps = {
  /** App name shown next to the logo.
   *  Defaults to NEXT_PUBLIC_APP_NAME (or "App"). */
  appName?: string;
  /** Where the app name links to (e.g., "/" or "/dashboard") */
  appHref: string;
  /** Logo URL in /public (e.g., "/logo-placeholder.jpg") */
  logoSrc?: string;
  /** Alt text for the logo */
  logoAlt?: string;
  /** Optional nav links shown on the right */
  links?: NavLink[];
  /** Optional right-side slot (e.g., <LogoutButton/> or a Login button) */
  right?: ReactNode;
};

export default function BaseHeader({
  appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'App',
  appHref,
  logoSrc = '/logo-placeholder.jpg',
  logoAlt = 'App Logo',
  links = [],
  right,
}: BaseHeaderProps) {
  return (
    <header className="w-full bg-base-200 border-b border-base-300 shadow flex items-center justify-between px-6 py-3">
      {/* Left: Logo + app name */}
      <div className="flex items-center gap-2">
        <Link href={appHref} aria-label={`${appName} home`}>
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={32}
            height={32}
            className="rounded"
            priority
          />
        </Link>
        <Link
          href={appHref}
          className="font-bold text-xl text-primary hover:underline"
        >
          {appName}
        </Link>
      </div>

      {/* Right: Navigation + optional right-side content */}
      <nav aria-label="Primary navigation">
        <ul className="flex items-center gap-4">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="hover:underline">
                {l.label}
              </Link>
            </li>
          ))}
          {right ? <li className="flex items-center">{right}</li> : null}
        </ul>
      </nav>
    </header>
  );
}
