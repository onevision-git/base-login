// src/app/dashboard/layout.tsx

import '../../styles/globals.css';
import Header from '../../components/DashboardHeader'; // Your custom header for dashboard
import Footer from '../../components/DashboardFooter'; // Your custom footer for dashboard
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Base Login',
  description: 'User dashboard for Base Login app',
};

type DashboardLayoutProps = { children: React.ReactNode };

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <Header /> {/* Your custom dashboard header with logout, etc. */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
