### System Admin Accounts

- Define superadmin emails in your environment variables.
- Local development: add them to `.env.local`
- Production: set them in Vercel Project Settings → Environment Variables

Example:
SUPERADMIN_EMAILS=matt@onevision.co.uk,alice@partner.com

Any user who signs in with one of these emails will see the **System Settings** page.

### System Email Formatting

### See docs/email-runbook.md

The system sends the following emails:

- **Signup confirmation** — sent after a new user registers, with a magic link to verify their email.
- **Invite (and resend)** — sent when an admin invites a teammate; includes inviter’s email in the message.
- **Password reset request** — sent when a user requests to reset their password; includes a one-time token link.
- **Password reset confirm** — updates the password once the user clicks the token link and submits a new password.
- **Admin alerts** — system admins (from `SUPERADMIN_EMAILS`) are notified on new sign-ups and invite acceptances.

### Required Environment Variables

- `RESEND_API_KEY` — API key for Resend (emails).
- `EMAIL_FROM` — from address (e.g., `noreply@onevision.co.uk`).
- `NEXT_PUBLIC_APP_URL` — base URL used for links.
- `JWT_SECRET` — used for signup/invite tokens.
- `SUPERADMIN_EMAILS` — comma-separated list of admin recipients.
- `ENABLE_PASSWORD_RESET` — must be `"true"` to allow password reset.
- `RESET_TOKEN_TTL_MINUTES` — (optional) token expiry, default 60 minutes.
