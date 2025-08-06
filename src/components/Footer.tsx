'use client';

import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on login and signup pages
  if (pathname === '/login' || pathname === '/signup') {
    return null;
  }

  return (
    <footer className="bg-base-200 text-center py-4">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} Base Login. All rights reserved.
      </p>
    </footer>
  );
}
