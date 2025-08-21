// File: src/app/(app)/team/TeamInviteForm.tsx
'use client';

import React, { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface TeamInviteFormProps {
  userCount: number;
  maxUsers: number;
  canInvite: boolean;
  /** Pending invite emails for this company & domain (lowercased preferred) */
  pendingEmails: string[];
}

type Role = 'standard' | 'admin';

export default function TeamInviteForm({
  userCount,
  maxUsers,
  canInvite,
  pendingEmails,
}: TeamInviteFormProps) {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('standard');

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Existence check UI state
  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pendingExists, setPendingExists] = useState<boolean>(false);

  // Prevent blur check from interfering with click/submit
  const submittingRef = useRef(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const hasPendingInvite = (value: string) => {
    const v = value.trim().toLowerCase();
    return pendingEmails.some((e) => e.toLowerCase() === v);
  };

  async function checkUserExists(
    value: string,
    updateState: boolean = true,
  ): Promise<boolean | null> {
    const trimmed = value.trim();

    if (updateState && !submittingRef.current) {
      setEmailError(null);
      setExists(null);
      setPendingExists(false);
    }

    if (!trimmed) return null;
    if (!validateEmail(trimmed)) {
      if (updateState && !submittingRef.current) {
        setEmailError('Please enter a valid email address.');
      }
      return null;
    }

    // 1) Local: block if a pending invite already exists
    const pending = hasPendingInvite(trimmed);
    if (updateState && !submittingRef.current) {
      setPendingExists(pending);
      if (pending) {
        setEmailError('An invite is already pending for this email.');
        return null;
      }
    }
    if (pending) return null;

    // 2) Remote: check if the email is already a registered user
    try {
      if (updateState && !submittingRef.current) setChecking(true);
      const res = await fetch(
        `/api/auth/user-exists?email=${encodeURIComponent(trimmed)}`,
        { method: 'GET', credentials: 'include' },
      );
      const data = (await res.json()) as { exists?: boolean; error?: string };

      if (!res.ok) {
        if (updateState && !submittingRef.current) {
          setEmailError(data.error ?? 'Unable to check email right now.');
        }
        return null;
      }

      const existsValue = Boolean(data.exists);
      if (updateState && !submittingRef.current) setExists(existsValue);
      return existsValue;
    } catch {
      if (updateState && !submittingRef.current) {
        setEmailError('Unable to check email right now.');
      }
      return null;
    } finally {
      if (updateState && !submittingRef.current) setChecking(false);
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError('Please enter an email address.');
      submittingRef.current = false;
      return;
    }
    if (!validateEmail(trimmed)) {
      setEmailError('Please enter a valid email address.');
      submittingRef.current = false;
      return;
    }

    // Block if there is already a pending invite locally
    if (hasPendingInvite(trimmed)) {
      setPendingExists(true);
      setEmailError('An invite is already pending for this email.');
      submittingRef.current = false;
      return;
    }

    const existsNow = await checkUserExists(trimmed, false);
    if (existsNow === true) {
      setExists(true);
      setMessage('This email is already registered.');
      submittingRef.current = false;
      return;
    }
    if (existsNow === null) {
      if (!pendingExists) {
        setMessage('Could not verify email right now. Please try again.');
      }
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: trimmed, role }),
      });
      const result = await res.json();

      if (res.ok) {
        setMessage('Invitation sent successfully!');
        setEmail('');
        setRole('standard');
        setExists(null);
        setPendingExists(false);
        setEmailError(null);
        router.refresh(); // refresh the table so the new pending email appears
      } else {
        setMessage(result.error || 'Failed to send invitation.');
      }
    } catch {
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <p className="mb-4 text-sm text-gray-700">
        Current users: {userCount} / {maxUsers}
      </p>

      {canInvite ? (
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Email */}
          <div className="form-control space-y-1">
            <label htmlFor="invite-email" className="label p-0">
              <span className="label-text text-sm">Email</span>
            </label>
            <input
              id="invite-email"
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
                setExists(null);
                setPendingExists(false);
                setMessage(null);
              }}
              onBlur={() => void checkUserExists(email)}
              required
              aria-invalid={
                Boolean(emailError) || exists === true || pendingExists
              }
              aria-describedby="invite-email-help"
            />
            <p id="invite-email-help" className="text-xs min-h-5">
              {checking && <span className="text-gray-500">Checking…</span>}
              {!checking && pendingExists && (
                <span className="text-error">
                  An invite is already pending for this email.
                </span>
              )}
              {!checking && exists === true && !pendingExists && (
                <span className="text-error">
                  This email is already registered.
                </span>
              )}
              {!checking && emailError && !pendingExists && (
                <span className="text-error">{emailError}</span>
              )}
            </p>
          </div>

          {/* Role */}
          <div className="form-control mt-2 space-y-1">
            <label htmlFor="invite-role" className="label p-0">
              <span className="label-text text-sm">Role</span>
            </label>
            <select
              id="invite-role"
              className="select select-bordered w-full"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="standard">Standard</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Submit */}
          <div className="form-control mt-6">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={
                loading ||
                exists === true ||
                pendingExists ||
                Boolean(emailError) ||
                !email.trim()
              }
              onPointerDown={() => {
                submittingRef.current = true;
              }}
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          {userCount >= maxUsers
            ? 'User limit reached.'
            : 'You do not have permission to invite users.'}
        </p>
      )}

      {message && (
        <p className="mt-4 text-center text-sm text-error">{message}</p>
      )}
    </div>
  );
}
