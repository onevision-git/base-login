// src/app/(public)/reset-password/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '../_components/AuthLayout';

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
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email address and we’ll send you a link to reset your password."
      belowCard={
        <div className="flex items-center justify-between text-sm">
          <Link href="/login" className="link link-hover">
            Back to login
          </Link>
          <Link href="/signup" className="link link-hover">
            Create an account
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="auth-form" noValidate>
        <div className="form-control">
          <label htmlFor="email" className="label">
            <span className="label-text">Email address</span>
          </label>
          <input
            id="email"
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
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className={`btn btn-primary ${disabled ? 'loading' : ''}`}
            disabled={disabled}
            aria-disabled={disabled}
          >
            {state === 'submitting' ? 'Sending…' : 'Send reset link'}
          </button>
        </div>

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
      </form>
    </AuthLayout>
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
    <AuthLayout
      title="Set a new password"
      subtitle="Enter a new password for your account. Password must be at least 8 characters."
      belowCard={
        <div className="flex items-center justify-between text-sm">
          <Link href="/login" className="link link-hover">
            Back to login
          </Link>
          <Link href="/signup" className="link link-hover">
            Create an account
          </Link>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="auth-form" noValidate>
        <div className="form-control">
          <label htmlFor="new-password" className="label">
            <span className="label-text">New password</span>
          </label>
          <input
            id="new-password"
            type="password"
            required
            autoComplete="new-password"
            className={`input input-bordered ${tooShort ? 'input-error' : ''}`}
            placeholder="********"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={disabled}
          />
          {tooShort && (
            <p className="text-error text-sm mt-1">
              Password must be at least 8 characters.
            </p>
          )}
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className={`btn btn-primary ${disabled ? 'loading' : ''}`}
            disabled={disabled || tooShort}
            aria-disabled={disabled || tooShort}
          >
            {state === 'submitting' ? 'Updating…' : 'Update password'}
          </button>
        </div>

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
      </form>
    </AuthLayout>
  );
}
