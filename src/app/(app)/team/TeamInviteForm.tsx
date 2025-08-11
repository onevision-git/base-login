// File: src/app/team/TeamInviteForm.tsx
'use client';

import React, { useState, FormEvent } from 'react';

interface TeamInviteFormProps {
  userCount: number;
  maxUsers: number;
  canInvite: boolean;
}

export default function TeamInviteForm({
  userCount,
  maxUsers,
  canInvite,
}: TeamInviteFormProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'standard' | 'admin'>('standard');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      setMessage('Please enter an email address.');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ← include the auth cookie
        body: JSON.stringify({ email, role }),
      });
      const result = await res.json();

      if (res.ok) {
        setMessage('Invitation sent successfully!');
        setEmail('');
        setRole('standard');
      } else {
        setMessage(result.error || 'Failed to send invitation.');
      }
    } catch (error) {
      console.error(error);
      setMessage('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <p className="mb-4 text-sm text-gray-700">
        Current users: {userCount} / {maxUsers}
      </p>

      {canInvite ? (
        <form onSubmit={handleSubmit} className="space-y-4">
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
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
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
              onChange={(e) => setRole(e.target.value as 'standard' | 'admin')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="standard">Standard</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
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
