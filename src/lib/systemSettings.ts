// src/lib/systemSettings.ts
import { getSettings } from '@/models/Settings';

/**
 * Returns the platform default for new-company maxUsers.
 * Falls back to 3 if settings are unavailable or invalid.
 */
export async function getDefaultCompanyMaxUsers(): Promise<number> {
  try {
    const s = await getSettings();
    const n = Number(s.defaultInviteUsers ?? 3);
    if (!Number.isFinite(n) || n < 0) return 3;
    return Math.min(Math.max(n, 0), 1000);
  } catch {
    return 3;
  }
}
