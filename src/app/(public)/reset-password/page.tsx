// src/app/(public)/reset-password/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '../_components/AuthLayout';

type UiState = 'idle' | 'submitting' | 'success' | 'error';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-70">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const sp = useSearchParams();
  const token = sp.get('token')?.trim() || '';

  if (token) return <ConfirmForm token={token} />;
  return <RequestForm />;
}

function RequestForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<UiState>('idle');
  const [message, setMessage] = useState<string>('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await safeJson(res);
      if (res.ok) {
        setState('success');
        setMessage(
          data?.message || 'If that email exists, a reset link has been sent.',
        );
      } else {
        setState('error');
        setMessage(data?.error || 'Unable to send reset link.');
      }
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <AuthLayout title="Reset your password">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email</span>
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === 'submitting' || state === 'success'}
          />
        </div>

        <button
          type="submit"
          className={`btn btn-primary ${state === 'submitting' ? 'loading' : ''}`}
          disabled={!email || state === 'submitting' || state === 'success'}
        >
          Send reset link
        </button>

        {message && (
          <div
            className={`alert ${
              state === 'success' ? 'alert-success' : 'alert-error'
            }`}
          >
            <span>{message}</span>
          </div>
        )}

        <div className="pt-2">
          <Link className="link" href="/login">
            Back to login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

function ConfirmForm({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [state, setState] = useState<UiState>('idle');
  const [message, setMessage] = useState<string>('');

  // Optional UX guard: tiny check to avoid empty token submits
  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Missing or invalid reset token.');
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('submitting');
    setMessage('');

    try {
      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await safeJson(res);

      // Your API returns 202 Accepted on success
      if (res.status === 202 || res.ok) {
        setState('success');
        setMessage(
          data?.message ||
            'Your password has been updated. You can now sign in.',
        );
      } else {
        setState('error');
        setMessage(data?.error || 'Password reset failed.');
      }
    } catch {
      setState('error');
      setMessage('Network error. Please try again.');
    }
  }

  return (
    <AuthLayout title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-4">
        <input type="hidden" name="token" value={token} readOnly />

        <div className="form-control">
          <label className="label">
            <span className="label-text">New password</span>
          </label>
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="input input-bordered w-full"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={state === 'submitting' || state === 'success'}
          />
          <label className="label">
            <span className="label-text-alt">
              Must be at least 8 characters.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className={`btn btn-primary ${state === 'submitting' ? 'loading' : ''}`}
          disabled={
            !token ||
            newPassword.length < 8 ||
            state === 'submitting' ||
            state === 'success'
          }
        >
          Update password
        </button>

        {message && (
          <div
            className={`alert ${
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
      </form>
    </AuthLayout>
  );
}

// Helper that safely reads JSON (handles 204/empty)
async function safeJson(res: Response) {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}
