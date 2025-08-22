// src/components/BaseFooter.tsx
'use client';

import Link from 'next/link';
import { APP_VERSION } from '@/lib/version';

type NavLink = {
  href: string;
  label: string;
};

type BaseFooterProps = {
  owner?: string;
  note?: string;
  links?: NavLink[];
  className?: string;
  variant?: 'public' | 'dashboard';
};

export default function BaseFooter({
  owner = process.env.NEXT_PUBLIC_ORG_NAME ?? 'Your Company',
  note = 'All rights reserved.',
  links = [],
  className = '',
  variant = 'public',
}: BaseFooterProps) {
  const year = new Date().getFullYear();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? 'Your App';

  const baseClasses = 'w-full text-center py-6 text-sm';
  const variantClasses =
    variant === 'dashboard' ? 'bg-base-300 mt-auto' : 'bg-base-200';

  return (
    <footer className={`${baseClasses} ${variantClasses} ${className}`.trim()}>
      <p className="text-base-content/80">
        &copy; {year} {owner}. {note}
      </p>

      <p className="mt-1 text-xs text-base-content/60">
        {appName} v{APP_VERSION}
      </p>

      {links.length > 0 ? (
        <ul className="mt-2 flex items-center justify-center gap-4 text-xs">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="link link-hover">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </footer>
  );
}
