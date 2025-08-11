'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Status =
  | { state: 'idle' | 'loading' }
  | { state: 'success'; message: string }
  | { state: 'error'; message: string };

export default function ConfirmPage() {
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

        // Redirect straight to /login after a short pause
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
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-6 border">
        <h1 className="text-2xl font-semibold mb-2">Confirming your email…</h1>

        {status.state === 'idle' || status.state === 'loading' ? (
          <p className="text-gray-600">Please wait a moment…</p>
        ) : null}

        {status.state === 'success' ? (
          <>
            <p className="text-green-700">{status.message}</p>
            <p className="mt-2 text-gray-600">
              Redirecting you to the login page…
            </p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => router.push('/login')}
            >
              Go to login now
            </button>
          </>
        ) : null}

        {status.state === 'error' ? (
          <>
            <p className="text-red-700">{status.message}</p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => router.refresh()}
            >
              Try again
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}
