// src/components/DashboardHeader.tsx

import Link from 'next/link';
import LogoutButton from './LogoutButton'; // Import your client-side logout button

export default function DashboardHeader() {
  return (
    <header className="bg-secondary text-secondary-content py-4 shadow">
      <nav className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg tracking-wide">
            Dashboard - Base Login
          </span>
        </div>
        <ul className="flex items-center space-x-4">
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
