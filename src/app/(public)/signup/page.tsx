// src/app/(public)/signup/page.tsx
'use client';

import { useState } from 'react';
import AuthLayout from '../_components/AuthLayout';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // unified message area (blue for info, red for error)
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, orgName }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setMessage('Signed up successfully — check your email to confirm!');
        setIsError(false);
      } else {
        setMessage(
          typeof data?.error === 'string' ? data.error : 'Signup failed',
        );
        setIsError(true);
      }
    } catch {
      setMessage('Something went wrong. Please try again.');
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      footerNote="By continuing you agree to our Terms & Privacy Policy."
      belowCard={
        <div className="flex items-center justify-between text-sm">
          <a className="link link-hover" href="/login">
            Already have an account? Sign in
          </a>
        </div>
      }
    >
      {/* 
        Spacing fixes:
        - Use space-y-4 on the form to create consistent vertical rhythm.
        - Use label with py-0 and mb-1 to keep a small, consistent gap.
        - Ensure inputs are full width (w-full).
      */}
      <form onSubmit={handleSignup} noValidate className="auth-form space-y-4">
        {/* Org Name */}
        <div className="form-control">
          <label htmlFor="orgName" className="label py-0 mb-1">
            <span className="label-text">Organisation name</span>
          </label>
          <input
            id="orgName"
            type="text"
            required
            placeholder="Company"
            className="input input-bordered w-full"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            autoComplete="organization"
          />
        </div>

        {/* Email */}
        <div className="form-control">
          <label htmlFor="email" className="label py-0 mb-1">
            <span className="label-text">Email</span>
          </label>
          <input
            id="email"
            type="email"
            required
            placeholder="you@company.com"
            autoComplete="email"
            className="input input-bordered w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="form-control">
          <label htmlFor="password" className="label py-0 mb-1">
            <span className="label-text">Password</span>
          </label>
          <input
            id="password"
            type="password"
            required
            placeholder="••••••••"
            autoComplete="new-password"
            className="input input-bordered w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Message */}
        {message ? (
          <div
            role="alert"
            className={`alert ${isError ? 'alert-error' : 'alert-info'} mt-2`}
          >
            <span>{message}</span>
          </div>
        ) : null}

        {/* Submit */}
        <div className="form-control">
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={submitting}
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
