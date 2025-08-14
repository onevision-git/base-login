// src/app/(public)/confirm/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '../_components/AuthLayout';

type Status =
  | { state: 'idle' | 'loading' }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string };

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ConfirmContent />
    </Suspense>
  );
}

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  useEffect(() => {
    const token = searchParams.get('token');

    const run = async () => {
      if (!token) {
        setStatus({ state: 'error', message: 'Missing confirmation token.' });
        return;
      }

      setStatus({ state: 'loading' });

      try {
        const res = await fetch('/api/auth/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus({
            state: 'error',
            message: data?.error || 'Invalid or expired token.',
          });
          return;
        }

        setStatus({
          state: 'success',
          message: data?.message || 'Email confirmed successfully.',
        });

        // Redirect to /login after a short pause
        setTimeout(() => router.push('/login'), 1200);
      } catch (err) {
        console.error('Confirm page error:', err);
        setStatus({
          state: 'error',
          message: 'Something went wrong. Please try again.',
        });
      }
    };

    void run();
  }, [router, searchParams]);

  return (
    <AuthLayout
      title="Confirming your email…"
      belowCard={
        <div className="text-sm">
          <Link className="link link-hover" href="/login">
            Go to login
          </Link>
        </div>
      }
    >
      {/* Status blocks in a unified card body */}
      {(status.state === 'idle' || status.state === 'loading') && (
        <div role="status" className="alert alert-info">
          <span>Please wait a moment…</span>
        </div>
      )}

      {status.state === 'success' && (
        <>
          <div role="status" className="alert alert-success">
            <span>{status.message}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-4 w-full"
            onClick={() => router.push('/login')}
          >
            Go to login now
          </button>
        </>
      )}

      {status.state === 'error' && (
        <>
          <div role="alert" className="alert alert-error">
            <span>{status.message}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary mt-4 w-full"
            onClick={() => router.refresh()}
          >
            Try again
          </button>
        </>
      )}
    </AuthLayout>
  );
}
