// src/app/(public)/_components/AuthLayout.tsx
import type { ReactNode } from 'react';

type AuthLayoutProps = {
  title: string;
  subtitle?: ReactNode;
  footerNote?: ReactNode;
  children: ReactNode; // your form/content
  belowCard?: ReactNode; // links like "Create an account" / "Forgot password?"
};

export default function AuthLayout({
  title,
  subtitle,
  footerNote,
  children,
  belowCard,
}: AuthLayoutProps) {
  return (
    // No min-h-screen, no vertical centering — let the parent layout control height
    <main className="w-full">
      <div className="mx-auto w-full max-w-md px-4 py-6 md:py-8">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-base-content/70">{subtitle}</p>
          ) : null}
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body p-6 md:p-8">{children}</div>
        </div>

        {belowCard ? <div className="mt-4 md:mt-6">{belowCard}</div> : null}

        {footerNote ? (
          <p className="text-center text-xs opacity-60 mt-4 md:mt-6">
            {footerNote}
          </p>
        ) : null}
      </div>
    </main>
  );
}
