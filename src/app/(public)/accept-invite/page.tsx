'use client';

import { Suspense, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
      <main className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-4">Invalid invite link</h1>
        <p className="mb-4">This invite link is missing a token.</p>
        <p className="text-sm text-gray-600">
          Ask your admin to send a new invite, or{' '}
          <Link href="/login" className="underline">
            go to login
          </Link>
          .
        </p>
      </main>
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
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-2">Accept your invite</h1>
      <p className="text-sm text-gray-600 mb-6">
        Set a password to finish creating your account.
      </p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-md border px-3 py-2"
            placeholder="Create a strong password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error && password.length < 8}
          />
          <p className="text-xs text-gray-500">Minimum 8 characters.</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="confirm" className="block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            className={`w-full rounded-md border px-3 py-2 ${
              passwordsMismatch ? 'border-red-500' : ''
            }`}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            aria-invalid={passwordsMismatch}
            aria-describedby={passwordsMismatch ? 'mismatch-help' : undefined}
          />
          {passwordsMismatch && (
            <p id="mismatch-help" className="text-sm text-red-600">
              Passwords do not match.
            </p>
          )}
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white font-medium disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>

        <p className="mt-3 text-xs text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="underline">
            Log in
          </Link>
          .
        </p>
      </form>
    </main>
  );
}
