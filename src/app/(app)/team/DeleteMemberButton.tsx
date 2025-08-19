// File: src/app/(app)/team/DeleteMemberButton.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type InviteStatus = 'PENDING' | 'ACCEPTED';

export default function DeleteMemberButton({
  inviteId,
  email,
  status,
  disabled,
}: {
  inviteId: string; // needed for pending invites
  email: string; // needed for accepted users
  status: InviteStatus; // 'PENDING' or 'ACCEPTED'
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const title =
    status === 'PENDING' ? 'Delete pending invite' : 'Delete user account';
  const body =
    status === 'PENDING'
      ? `This will permanently remove the invite for ${email}.`
      : `This will permanently remove the user ${email} from your company. They will no longer be able to sign in.`;

  async function doDelete() {
    try {
      setBusy(true);
      setErr(null);

      let res: Response;

      if (status === 'PENDING') {
        // Delete the invite by inviteId
        res = await fetch('/api/auth/delete-invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ inviteId }),
        });
      } else {
        // Delete the accepted user by email
        res = await fetch('/api/auth/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.error || 'Failed to delete.');
        setBusy(false);
        return;
      }

      // Success: close & refresh
      setOpen(false);
      dialogRef.current?.close();
      router.refresh();
    } catch {
      setErr('Unexpected error occurred.');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-error btn-outline btn-sm"
        disabled={disabled || busy}
        onClick={() => {
          setOpen(true);
          setErr(null);
          dialogRef.current?.showModal();
        }}
      >
        Delete
      </button>

      <dialog ref={dialogRef} className="modal" open={open}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">{title}</h3>
          <p className="py-3">{body}</p>

          <div className="alert alert-warning my-2">
            <span>Are you sure? This cannot be undone.</span>
          </div>

          {err && <p className="text-error text-sm mt-2">{err}</p>}

          <div className="modal-action">
            <button
              className="btn"
              type="button"
              onClick={() => {
                setOpen(false);
                dialogRef.current?.close();
              }}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="btn btn-error"
              type="button"
              onClick={doDelete}
              disabled={busy}
            >
              {busy ? 'Deleting…' : 'Confirm delete'}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setOpen(false)}>close</button>
        </form>
      </dialog>
    </>
  );
}
