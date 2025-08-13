'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type ReqState = 'idle' | 'submitting' | 'success' | 'error';
type CfmState = 'idle' | 'submitting' | 'success' | 'error';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const sp = useSearchParams();
  const token = sp.get('token');

  useEffect(() => {
    document.title = token ? 'Set a new password' : 'Forgot Password';
  }, [token]);

  return token ? <ConfirmForm token={token} /> : <RequestForm />;
}

function RequestForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<ReqState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setMessage(null);

    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 202) {
        setState('success');
        setMessage(
          'If an account exists for that email, we’ve sent a reset link. Please check your inbox.',
        );
      } else if (res.status === 404) {
        setState('error');
        setMessage(
          'Password reset is currently unavailable. Please try again later or contact support.',
        );
      } else {
        const text = await res.text();
        setState('error');
        setMessage(text || 'Something went wrong. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  }

  const disabled = state === 'submitting';

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Forgot your password?</h1>
          <p className="text-sm opacity-80">
            Enter your email address and we’ll send you a link to reset your
            password.
          </p>

          <form onSubmit={onSubmit} className="form-control gap-4 mt-4">
            <label className="form-control">
              <span className="label-text">Email address</span>
              <input
                type="email"
                autoFocus
                required
                autoComplete="email"
                className="input input-bordered"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={disabled}
              />
            </label>

            <button
              type="submit"
              className={`btn btn-primary ${disabled ? 'loading' : ''}`}
              disabled={disabled}
              aria-disabled={disabled}
            >
              {state === 'submitting' ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          {message && (
            <div
              role="status"
              className={`alert mt-4 ${
                state === 'success' ? 'alert-success' : 'alert-error'
              }`}
            >
              <span>{message}</span>
            </div>
          )}

          <div className="divider" />

          <div className="flex items-center justify-between text-sm">
            <Link href="/(public)/login" className="link link-hover">
              Back to login
            </Link>
            <Link href="/(public)/signup" className="link link-hover">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [state, setState] = useState<CfmState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const tooShort = newPassword.length > 0 && newPassword.length < 8;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setMessage(null);

    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      if (res.status === 202) {
        setState('success');
        setMessage('Your password has been updated. You can now sign in.');
      } else if (res.status === 404) {
        setState('error');
        setMessage(
          'Password reset is currently unavailable. Please try again later.',
        );
      } else if (res.status === 422) {
        setState('error');
        setMessage('Password must be at least 8 characters.');
      } else if (res.status === 400) {
        const text = await res.text();
        setState('error');
        setMessage(text || 'Invalid request. Please re-open the reset link.');
      } else {
        const text = await res.text();
        setState('error');
        setMessage(text || 'Something went wrong. Please try again.');
      }
    } catch {
      setState('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  }

  const disabled = state === 'submitting';

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-2xl">Set a new password</h1>
          <p className="text-sm opacity-80">
            Enter a new password for your account. Password must be at least 8
            characters.
          </p>

          <form onSubmit={onSubmit} className="form-control gap-4 mt-4">
            <label className="form-control">
              <span className="label-text">New password</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                className={`input input-bordered ${
                  tooShort ? 'input-error' : ''
                }`}
                placeholder="********"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={disabled}
              />
            </label>

            {tooShort && (
              <p className="text-error text-sm">
                Password must be at least 8 characters.
              </p>
            )}

            <button
              type="submit"
              className={`btn btn-primary ${disabled ? 'loading' : ''}`}
              disabled={disabled || tooShort}
              aria-disabled={disabled || tooShort}
            >
              {state === 'submitting' ? 'Updating…' : 'Update password'}
            </button>
          </form>

          {message && (
            <div
              role="status"
              className={`alert mt-4 ${
                state === 'success' ? 'alert-success' : 'alert-error'
              }`}
            >
              <span>{message}</span>
            </div>
          )}

          {state === 'success' && (
            <div className="mt-2">
              <Link href="/login" className="btn btn-link px-0">
                Go to login
              </Link>
            </div>
          )}

          <div className="divider" />

          <div className="flex items-center justify-between text-sm">
            <Link href="/login" className="link link-hover">
              Back to login
            </Link>
            <Link href="/signup" className="link link-hover">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
