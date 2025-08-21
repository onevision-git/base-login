# Changelog

All notable changes to this project will be documented here.  
Format: Keep a running, human-readable list per release. Use semantic tags like **Added**, **Changed**, **Fixed**, **Removed**.

---

## [v1.02] - 2025-08-21

### Added

- `tools/diff-shared.ps1`: script to list and size changes in shared auth/lib/model code.
  Useful for syncing fixes across cloned projects (e.g., Base CRM).

### Notes

- No runtime changes. This release is purely a tooling improvement to support multi-app workflows.

---

## [v1.01] - 2025-08-21

### Added

- `User.lastLoginAt` (Date|null): set on successful sign-in to track last activity.
- Sign-in API now updates `lastLoginAt` on success.

### Notes

- Backward compatible; existing users will have `null` until next login.
- No migration needed.

---

## [v1.00] - 2025-08-21

### Added

- Initial Base-Login template with multi-tenant auth, invites, email verification, password reset, and basic dashboard.
