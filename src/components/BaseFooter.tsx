// src/components/BaseFooter.tsx
'use client';

import Link from 'next/link';

type NavLink = {
  href: string;
  label: string;
};

type BaseFooterProps = {
  /** Optional copyright owner text (e.g., "Base Login") */
  owner?: string;
  /** Optional suffix text after the owner (e.g., "All rights reserved.") */
  note?: string;
  /** Optional small set of links to show under/next to the copyright line */
  links?: NavLink[];
  /** Additional class names to append to the <footer> */
  className?: string;
  /** Background + border styling (defaults to public look) */
  variant?: 'public' | 'dashboard';
};

export default function BaseFooter({
  owner = 'Base Login',
  note = 'All rights reserved.',
  links = [],
  className = '',
  variant = 'public',
}: BaseFooterProps) {
  const year = new Date().getFullYear();

  const baseClasses = 'w-full text-center py-4';
  const variantClasses =
    variant === 'dashboard' ? 'bg-base-300 mt-auto' : 'bg-base-200';

  return (
    <footer className={`${baseClasses} ${variantClasses} ${className}`.trim()}>
      <p className="text-sm text-base-content/80">
        &copy; {year} {owner}. {note}
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
