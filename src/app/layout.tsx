import '../styles/globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Base Login',
  description: 'Your CRM starter built with Next.js, TypeScript & TailwindCSS',
};

type RootLayoutProps = { children: React.ReactNode };

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-base-100 text-base-content`}
      >
        {/* Global Header */}
        <header className="bg-primary text-primary-content py-4 shadow">
          <nav className="container mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold">Base Login</h1>
            <ul className="flex space-x-4">
              <li>
                <Link href="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:underline">
                  About
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        {/* Page Content */}
        <main className="flex-1 container mx-auto px-4 py-8">{children}</main>

        {/* Global Footer */}
        <footer className="bg-base-200 text-center py-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Base Login. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
