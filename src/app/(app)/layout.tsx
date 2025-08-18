// src/app/(app)/layout.tsx

import '../../styles/globals.css';
import Header from '../../components/DashboardHeader';
import Footer from '../../components/DashboardFooter';
import Breadcrumbs from '../../components/Breadcrumbs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Base Login',
  description: 'User dashboard for Base Login app',
};

type DashboardLayoutProps = { children: React.ReactNode };

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <>
      <Header />
      {/* Breadcrumbs appear on all logged-in pages, directly under the header */}
      <Breadcrumbs />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
