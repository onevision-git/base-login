// src/app/page.tsx
import Header from '../components/Header';
import Footer from '../components/Footer';
import Breadcrumbs from '../components/Breadcrumbs';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Global header */}
      <Header />

      {/* Breadcrumbs under header */}
      <Breadcrumbs />

      {/* Main content */}
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-base-100">
          <div className="container mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 items-center gap-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                  CHECK Ship SaaS faster with{' '}
                  <span className="text-primary">Base Login</span>
                </h1>
                <p className="mt-4 text-base-content/70 text-lg">
                  A reusable authentication starter with multi-tenancy, invites,
                  and ready-to-go UI. Focus on your product — not boilerplate.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/signup" className="btn btn-primary">
                    Get started
                  </Link>
                  <Link href="/login" className="btn btn-ghost">
                    I already have an account
                  </Link>
                </div>

                {/* Quick highlights */}
                <ul className="mt-6 grid sm:grid-cols-2 gap-3 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm" />
                    Multi-tenant by default
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm" />
                    Email/password + magic link confirm
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm" />
                    Team invites & roles
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm" />
                    Tailwind + daisyUI styling
                  </li>
                </ul>
              </div>

              {/* Placeholder visual */}
              <div className="hidden md:block">
                <div className="mockup-window border bg-base-200">
                  <div className="px-6 py-8 bg-base-100">
                    <div className="skeleton h-6 w-2/3 mb-4" />
                    <div className="skeleton h-4 w-full mb-2" />
                    <div className="skeleton h-4 w-5/6 mb-2" />
                    <div className="skeleton h-4 w-4/6" />
                    <div className="mt-6 flex gap-2">
                      <div className="skeleton h-10 w-24" />
                      <div className="skeleton h-10 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature cards */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <div className="card bg-base-200 shadow">
                <div className="card-body">
                  <h3 className="card-title">Authentication</h3>
                  <p>
                    Email/password sign-up & sign-in, confirmation flow, and
                    secure cookies built-in.
                  </p>
                </div>
              </div>
              <div className="card bg-base-200 shadow">
                <div className="card-body">
                  <h3 className="card-title">Multi-tenancy</h3>
                  <p>
                    Company-scoped data and invite-based team growth with
                    per-seat limits.
                  </p>
                </div>
              </div>
              <div className="card bg-base-200 shadow">
                <div className="card-body">
                  <h3 className="card-title">UI Kit</h3>
                  <p>
                    Tailwind + daisyUI components with consistent headers,
                    footers, and breadcrumbs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global footer */}
      <Footer />
    </div>
  );
}
