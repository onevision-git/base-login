// File: src/app/(app)/team/TeamInviteForm.tsx
'use client';

import React, { useState, FormEvent, useRef } from 'react';

interface TeamInviteFormProps {
  userCount: number;
  maxUsers: number;
  canInvite: boolean;
}

type Role = 'standard' | 'admin';

export default function TeamInviteForm({
  userCount,
  maxUsers,
  canInvite,
}: TeamInviteFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('standard');

  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Existence check UI state
  const [checking, setChecking] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Prevent blur check from interfering with click/submit
  const submittingRef = useRef(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  /**
   * Check if a user exists.
   * Returns true/false on success, or null when the check failed.
   * IMPORTANT: While submitting, this should not toggle UI state.
   */
  async function checkUserExists(
    value: string,
    updateState: boolean = true,
  ): Promise<boolean | null> {
    const trimmed = value.trim();

    if (updateState && !submittingRef.current) {
      setEmailError(null);
      setExists(null);
    }

    if (!trimmed) return null;
    if (!validateEmail(trimmed)) {
      if (updateState && !submittingRef.current) {
        setEmailError('Please enter a valid email address.');
      }
      return null;
    }

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
    } catch (err) {
      console.error(err);
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

    // Re-check existence as the source of truth (no mid-submit UI toggles)
    const existsNow = await checkUserExists(trimmed, false);
    if (existsNow === true) {
      setExists(true);
      setMessage('This email is already registered.');
      submittingRef.current = false;
      return;
    }
    if (existsNow === null) {
      setMessage('Could not verify email right now. Please try again.');
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
        setEmailError(null);
      } else {
        setMessage(result.error || 'Failed to send invitation.');
      }
    } catch (error) {
      console.error(error);
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
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email field */}
          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
                setExists(null);
                setMessage(null);
              }}
              onBlur={() => void checkUserExists(email)}
              required
              aria-invalid={Boolean(emailError) || exists === true}
              aria-describedby="invite-email-help"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p id="invite-email-help" className="mt-1 text-sm">
              {checking && <span className="text-gray-500">Checking…</span>}
              {!checking && exists === true && (
                <span className="text-red-600">
                  This email is already registered.
                </span>
              )}
              {!checking && emailError && (
                <span className="text-red-600">{emailError}</span>
              )}
            </p>
          </div>

          {/* Role selector */}
          <div>
            <label
              htmlFor="invite-role"
              className="block text-sm font-medium text-gray-700"
            >
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            onPointerDown={() => {
              // fires before the input blur; prevents the blur-check from
              // flipping state that could disable the button or cancel submit
              submittingRef.current = true;
            }}
            disabled={
              loading ||
              /* removed `checking` to avoid race with blur check */
              exists === true ||
              Boolean(emailError) ||
              !email.trim()
            }
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 disabled:opacity-60 hover:bg-blue-700 focus:outline-none"
          >
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">
          {userCount >= maxUsers
            ? 'User limit reached.'
            : 'You do not have permission to invite users.'}
        </p>
      )}

      {message && (
        <p className="mt-4 text-center text-sm text-red-600">{message}</p>
      )}
    </div>
  );
}
