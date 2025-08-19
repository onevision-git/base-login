// src/lib/systemAdmin.ts

/**
 * System admin detection via allow-list.
 * Set env: SUPERADMIN_EMAILS="matt@onevision.co.uk,other@domain.com"
 */

function parseList(v?: string | null): string[] {
  if (!v) return [];
  return v
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isSystemAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = parseList(process.env.SUPERADMIN_EMAILS);
  return list.includes(email.toLowerCase());
}

export function assertSystemAdmin(email?: string | null) {
  if (!isSystemAdminEmail(email)) {
    const err = new Error('Forbidden: system admin only');
    // @ts-expect-error – custom field for convenient handling in routes
    err.statusCode = 403;
    throw err;
  }
}
