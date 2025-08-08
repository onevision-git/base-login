import Header from '../../components/Header';
import Footer from '../../components/Footer';

type PublicLayoutProps = { children: React.ReactNode };

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <>
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
