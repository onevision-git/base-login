# Changelog

## v1.00 — Initial stable release

- Base-Login app (Next.js 15) with email/password auth
- Company + user + invite models; domain-guarded invites
- Password reset (request/confirm), confirm email, session endpoints
- Team management UI (invite/resend/delete), rate limiting, admin alerts
- Resend email templates; consistent headers/footers
- MongoDB connection pooling; Node runtime for crypto/bcrypt routes
- Added packages/auth/package.json with exports to lock public API
