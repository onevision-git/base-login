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

    const emailNorm = (email || '').trim().toLowerCase();
    const passwordVal = password || '';

    if (!emailNorm || !passwordVal) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: emailNorm, password: passwordVal }),
      });

      if (!res.ok) {
        // Surface the exact server message if present
        let msg = 'Sign in failed. Please check your details and try again.';
        try {
          const data = await res.json();
          if (typeof data?.error === 'string' && data.error.trim()) {
            msg = data.error;
          }
        } catch {
          // ignore parse errors
        }
        setError(msg);
        return;
      }

      // Success
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

    const emailNorm = (forgotEmail || '').trim().toLowerCase();
    if (!emailNorm) {
      setFpError('Please enter your email.');
      return;
    }

    setFpSubmitting(true);
    try {
      // 1) Try the REAL reset request (flag-controlled)
      const res1 = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailNorm }),
      });

      // If the real endpoint is enabled, we expect 202.
      if (res1.status === 202) {
        const data = await res1.json().catch(() => ({}));
        const msg =
          typeof data?.message === 'string' && data.message.trim()
            ? data.message
            : 'If an account exists for that email, we’ve sent a reset link.';
        setFpInfo(msg);
        return;
      }

      // If it’s disabled (404), fall back to the placeholder endpoint
      if (res1.status === 404) {
        const res2 = await fetch('/api/auth/password-reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailNorm }),
        });

        // Placeholder usually returns 501 with a message
        const data2 = await res2.json().catch(() => ({}));
        const serverMsg =
          typeof data2?.message === 'string' && data2.message.trim()
            ? data2.message
            : null;

        const notConfiguredHint =
          'Note: Password resets are not configured in this environment yet.';
        const genericMsg =
          'If this email exists, you will receive reset instructions when password resets are enabled.';

        setFpInfo(
          [serverMsg, genericMsg, notConfiguredHint].filter(Boolean).join(' '),
        );
        return;
      }

      // Any other status from the real endpoint: keep it simple and informative
      const fallbackMsg =
        'If this email exists, you will receive reset instructions when password resets are enabled.';
      setFpInfo(fallbackMsg);
    } catch {
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
