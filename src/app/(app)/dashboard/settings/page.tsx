// src/app/(app)/dashboard/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Settings = {
  _id: string;
  defaultInviteUsers: number;
  updatedAt?: string;
  createdAt?: string;
  updatedBy?: string;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return String(err);
  } catch {
    return 'Unknown error';
  }
}

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [settings, setSettings] = useState<Settings | null>(null);
  const [defaultInviteUsers, setDefaultInviteUsers] = useState<number>(3);

  async function fetchSettings() {
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch('/api/system/settings', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      const data = (await res.json()) as { settings: Settings };
      setSettings(data.settings);
      setDefaultInviteUsers(data.settings.defaultInviteUsers ?? 3);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch('/api/system/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultInviteUsers }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body?.error || `Save failed (${res.status})`);
      }
      const data = (await res.json()) as { settings: Settings };
      setSettings(data.settings);
      setOk('Saved');
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">System Settings</h1>

      {loading ? (
        <div className="skeleton h-24 w-full" />
      ) : error ? (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
          <button className="btn btn-sm ml-auto" onClick={fetchSettings}>
            Retry
          </button>
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="card-title">Invites</h2>

            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">
                  Default number of invite users
                </span>
              </div>

              <input
                type="number"
                min={0}
                max={1000}
                value={defaultInviteUsers}
                onChange={(e) =>
                  setDefaultInviteUsers(parseInt(e.target.value || '0', 10))
                }
                className="input input-bordered w-full max-w-xs"
              />

              <div className="label">
                <span className="label-text-alt">
                  Used when a new company is created (can be overridden
                  per-company later).
                </span>
              </div>
            </label>

            <div className="card-actions mt-4">
              <button
                className="btn btn-primary"
                onClick={saveSettings}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>

              <button
                className="btn btn-ghost"
                onClick={fetchSettings}
                disabled={saving}
              >
                Reset
              </button>
            </div>

            {ok && <div className="alert alert-success mt-4">{ok}</div>}
          </div>

          {settings && (
            <div className="card-footer px-6 pb-6 text-sm opacity-70">
              <div>
                <span className="font-medium">Last updated:</span>{' '}
                {settings.updatedAt
                  ? new Date(settings.updatedAt).toLocaleString()
                  : '—'}
              </div>
              <div>
                <span className="font-medium">Updated by:</span>{' '}
                {settings.updatedBy || '—'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
