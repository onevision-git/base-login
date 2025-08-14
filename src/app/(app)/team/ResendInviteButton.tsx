'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  inviteId: string;
  disabled?: boolean;
};

export default function ResendInviteButton({ inviteId, disabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState(false);

  const onClick = async () => {
    if (disabled || loading) return;

    setLoading(true);
    setErr(null);
    setOk(false);

    try {
      const res = await fetch('/api/auth/invite/resend', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErr(data?.error || 'Failed to resend invite.');
        return;
      }

      setOk(true);
      // Refresh the server-rendered table (updates "Invited" time)
      router.refresh();
    } catch (e) {
      console.error(e);
      setErr('Unexpected error.');
    } finally {
      setLoading(false);
      setTimeout(() => setOk(false), 2000);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        title={disabled ? 'Invite already accepted' : 'Resend invite email'}
        className={`btn btn-sm btn-outline ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        }`}
      >
        {loading ? 'Resending…' : 'Resend'}
      </button>
      {ok && (
        <span className="text-xs text-green-600" role="status">
          Sent
        </span>
      )}
      {err && (
        <span className="text-xs text-red-600" role="alert">
          {err}
        </span>
      )}
    </div>
  );
}
