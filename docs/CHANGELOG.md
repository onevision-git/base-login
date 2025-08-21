# Changelog

All notable changes to this project will be documented here.  
Format: Keep a running, human‑readable list per release. Use semantic tags like **Added**, **Changed**, **Fixed**, **Removed**.

---

## [v1.01] - 2025-08-21

### Added

- `User.lastLoginAt` (Date|null): set on successful sign‑in to track last activity.
- Sign‑in API now updates `lastLoginAt` on success.

### Notes

- Backward compatible; existing users will have `null` until next login.
- No migration needed.

## [v1.00] - 2025-08-21

### Added

- Initial Base-Login template with multi‑tenant auth, invites, email verification, password reset, and basic dashboard.
