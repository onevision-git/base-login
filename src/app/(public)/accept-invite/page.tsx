// src/app/(public)/accept-invite/page.tsx
'use client';

import { Suspense, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '../_components/AuthLayout';

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!token) {
    return (
      <AuthLayout
        title="Invalid invite link"
        subtitle={
          <>
            This invite link is missing a token.
            <br />
            Ask your admin to send a new invite.
          </>
        }
        belowCard={
          <div className="text-sm">
            <Link href="/login" className="link link-hover">
              Go to login
            </Link>
          </div>
        }
      >
        <div />
      </AuthLayout>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set('token', token);
      form.set('password', password);
      form.set('confirm', confirm);

      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        body: form,
      });

      if (res.redirected) {
        window.location.href = res.url;
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data?.error === 'string'
            ? data.error
            : 'Unable to accept invite.',
        );
        return;
      }

      window.location.href = '/login?accepted=1';
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const passwordsMismatch = confirm.length > 0 && password !== confirm;

  return (
    <AuthLayout
      title="Accept your invite"
      subtitle="Set a password to finish creating your account."
      belowCard={
        <p className="text-sm">
          Already have an account?{' '}
          <Link href="/login" className="link link-hover">
            Log in
          </Link>
          .
        </p>
      }
      footerNote="By continuing you agree to our Terms & Privacy Policy."
    >
      <form onSubmit={onSubmit} noValidate className="auth-form">
        <input type="hidden" name="token" value={token} />

        {/* Password */}
        <div className="form-control space-y-1">
          <label htmlFor="password" className="label p-0">
            <span className="label-text text-sm">Password</span>
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="input input-bordered w-full"
            placeholder="Create a strong password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error && password.length < 8}
          />
          <p className="text-xs min-h-5 opacity-70">Minimum 8 characters.</p>
        </div>

        {/* Confirm Password */}
        <div className="form-control mt-4 space-y-1">
          <label htmlFor="confirm" className="label p-0">
            <span className="label-text text-sm">Confirm password</span>
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            className={`input input-bordered w-full ${
              passwordsMismatch ? 'input-error' : ''
            }`}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={passwordsMismatch}
            aria-describedby={passwordsMismatch ? 'mismatch-help' : undefined}
          />
          <p id="mismatch-help" className="text-xs min-h-5">
            {passwordsMismatch && (
              <span className="text-error">Passwords do not match.</span>
            )}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="alert alert-error mt-4">
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="form-control mt-6">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
