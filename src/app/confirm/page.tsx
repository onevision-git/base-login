'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function ConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>(
    'verifying',
  );

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        return;
      }

      try {
        const res = await fetch('/api/auth/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Confirm error:', err);
        setStatus('error');
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      {status === 'verifying' && <p>Verifying your account...</p>}
      {status === 'success' && <p>Email confirmed! Redirecting...</p>}
      {status === 'error' && <p>Something went wrong. Please try again.</p>}
    </div>
  );
}
