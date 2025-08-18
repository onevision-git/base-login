// src/app/(public)/layout.tsx
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Breadcrumbs from '../../components/Breadcrumbs';

type PublicLayoutProps = { children: React.ReactNode };

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      {/* Breadcrumbs appear on all public pages, directly under the header */}
      <Breadcrumbs />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
