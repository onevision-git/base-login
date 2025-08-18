// src/components/Breadcrumbs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function toLabel(segment: string) {
  // turn "reset-password" -> "Reset Password"
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function Breadcrumbs() {
  const pathname = usePathname() || '/';
  const segments = pathname.split('/').filter(Boolean);

  // Build cumulative hrefs for each segment
  const crumbs = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');
    return { href, label: toLabel(seg) };
    // Optionally map special labels here if you want bespoke titles:
    // if (seg === 'dashboard') return { href, label: 'Dashboard' };
  });

  return (
    <div className="w-full bg-base-100 border-b border-base-300">
      <nav className="breadcrumbs text-sm px-6 py-2" aria-label="Breadcrumb">
        <ul>
          <li>
            <Link href="/">Home</Link>
          </li>

          {/* Render each segment as a breadcrumb */}
          {crumbs.map((c, i) => (
            <li key={c.href}>
              {/* Last crumb should be non-link (current page) */}
              {i === crumbs.length - 1 ? (
                <span className="opacity-80">{c.label}</span>
              ) : (
                <Link href={c.href}>{c.label}</Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
