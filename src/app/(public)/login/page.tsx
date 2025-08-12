// src/app/(public)/login/page.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // Sign-in state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot-password state
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@example.com';
  const forgotDialogRef = useRef<HTMLDialogElement | null>(null);
  const [forgotEmail, setForgotEmail] = useState<string>('');
  const [fpSubmitting, setFpSubmitting] = useState(false);
  const [fpInfo, setFpInfo] = useState<string | null>(null); // single blue banner
  const [fpError, setFpError] = useState<string | null>(null); // red only for validation/network

  const openForgotDialog = () => {
    setForgotEmail((prev) => prev || email); // prefill from sign-in email
    setFpInfo(null);
    setFpError(null);
    forgotDialogRef.current?.showModal();
  };
  const closeForgotDialog = () => {
    setFpSubmitting(false);
    forgotDialogRef.current?.close();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data?.error ||
            'Sign in failed. Please check your details and try again.',
        );
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onForgotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFpInfo(null);
    setFpError(null);

    if (!forgotEmail) {
      setFpError('Please enter your email.');
      return;
    }

    try {
      setFpSubmitting(true);
      const res = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json().catch(() => ({}));

      // Single info banner UX:
      // - If the placeholder endpoint is enabled, we expect 501.
      // - If disabled (404) or any other status, we still show an info message
      //   that reset isn’t configured yet (keeps UX simple + honest).
      if (res.ok || !res.ok) {
        const serverMsg =
          typeof data?.message === 'string' && data.message.trim().length > 0
            ? data.message
            : null;

        const genericMsg =
          'If this email exists, you will receive reset instructions when password resets are enabled.';

        // Compose a single info string and ensure no red banner shows alongside.
        const notConfiguredHint =
          'Note: Password resets are not configured in this environment yet.';
        setFpInfo(
          [serverMsg, genericMsg, notConfiguredHint].filter(Boolean).join(' '),
        );
        setFpError(null);
      }
    } catch {
      // Network/fetch error: show red banner
      setFpError('Something went wrong. Please try again.');
    } finally {
      setFpSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="opacity-80">Sign in to your account</p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <form onSubmit={onSubmit} noValidate>
              {/* Email */}
              <div className="form-control">
                <label htmlFor="email" className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  id="email"
                  type="email"
                  className="input input-bordered"
                  placeholder="you@company.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="form-control mt-4">
                <label htmlFor="password" className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  id="password"
                  type="password"
                  className="input input-bordered"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Error */}
              {error ? (
                <div role="alert" className="alert alert-error mt-4">
                  <span>{error}</span>
                </div>
              ) : null}

              {/* Submit */}
              <div className="form-control mt-6">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            </form>

            {/* Links */}
            <div className="mt-6 flex items-center justify-between text-sm">
              <a className="link link-hover" href="/signup">
                Create an account
              </a>

              <button
                type="button"
                className="link link-hover text-left"
                onClick={openForgotDialog}
                aria-haspopup="dialog"
                aria-controls="forgot-password-dialog"
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>

        {/* Small print / footer note (optional) */}
        <p className="text-center text-xs opacity-60 mt-6">
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>

      {/* Forgot Password Modal */}
      <dialog
        id="forgot-password-dialog"
        ref={forgotDialogRef}
        className="modal"
        aria-labelledby="forgot-password-title"
      >
        <div className="modal-box">
          <h2 id="forgot-password-title" className="font-bold text-lg">
            Reset your password
          </h2>

          <form className="mt-2 space-y-3" onSubmit={onForgotSubmit} noValidate>
            <label htmlFor="fp-email" className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              id="fp-email"
              type="email"
              className="input input-bordered w-full"
              placeholder="you@company.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              autoFocus
            />

            {/* Single banner: prefer info; show red only for validation/network */}
            {fpError ? (
              <div role="alert" className="alert alert-error">
                <span>{fpError}</span>
              </div>
            ) : fpInfo ? (
              <div role="status" className="alert alert-info">
                <span>{fpInfo}</span>
              </div>
            ) : null}

            <div className="modal-action">
              <button type="button" className="btn" onClick={closeForgotDialog}>
                Close
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={fpSubmitting}
              >
                {fpSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </div>
          </form>

          <div className="mt-4 text-sm opacity-70">
            <p>
              Need immediate help? Contact{' '}
              <a
                className="link"
                href={`mailto:${supportEmail}?subject=Password%20reset%20help`}
              >
                {supportEmail}
              </a>
              .
            </p>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button aria-label="Close dialog">close</button>
        </form>
      </dialog>
    </main>
  );
}
