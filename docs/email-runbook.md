# Email Runbook — Base Login

This document describes how email flows work in the Base Login system, where to find their implementations, and which environment variables are required.

---

## Overview

The platform sends several categories of emails:

- **User-facing emails**
  - Signup confirmation (magic link)
  - Invite (and resend)
  - Password reset request
  - Password reset confirm

- **Admin alert emails**
  - New signup confirmed
  - Invite accepted

Emails are delivered via **Resend** (`RESEND_API_KEY` required). If not configured, URLs and details are logged to the console for development.

---

## Environment Variables

| Variable                  | Purpose                                                      | Required |
|----------------------------|--------------------------------------------------------------|----------|
| `RESEND_API_KEY`          | API key for sending emails via Resend                        | Yes      |
| `EMAIL_FROM`              | From address (e.g., `noreply@onevision.co.uk`)               | Yes      |
| `NEXT_PUBLIC_APP_URL`     | Base URL used for links in emails                            | Yes      |
| `JWT_SECRET`              | Used for signing magic link and invite tokens                | Yes      |
| `SUPERADMIN_EMAILS`       | Comma-separated list of admin emails for alert notifications | Optional |
| `ENABLE_PASSWORD_RESET`   | Must be `"true"` to allow password reset confirm route       | Optional |
| `RESET_TOKEN_TTL_MINUTES` | Token expiry (default: 60 minutes)                           | Optional |

---

## User-Facing Emails

### 1. Signup Confirmation
- **Trigger:** User submits `/signup` form.  
- **Route:** `src/app/api/auth/signup/route.ts`  
- **Helper:** `packages/auth/src/email.ts → sendMagicLink(to, link)`  
- **Copy:** “Confirm your Base Login email” with CTA link.  
- **Notes:** Falls back to simple HTML email if template/env misconfigured.

---

### 2. Invite (first-time)
- **Trigger:** Admin invites user from the dashboard.  
- **Route:** `src/app/api/auth/invite/route.ts`  
- **Helper:** `packages/auth/src/email.ts → sendInviteEmail({ to, token, inviterEmail })`  
- **Copy:** “You’re invited… {inviterEmail} has invited you to sign up to Base Login.”  
- **Checks:** 
  - Invitee domain must match inviter’s domain.  
  - Seat-cap enforced via `Company.maxUsers`.  

---

### 3. Invite Resend
- **Trigger:** Admin resends a pending invite.  
- **Route:** `src/app/api/auth/invite/resend/route.ts`  
- **Helper:** Reuses `sendInviteEmail`.  
- **Copy:** Identical to first invite.  
- **Notes:** `invitedAt` is updated to show recent resend time in the UI.

---

### 4. Password Reset Request
- **Trigger:** User requests reset at `/reset-password`.  
- **Route:** `src/app/api/auth/password-reset/request/route.ts`  
- **Helper:** `src/lib/email.ts → sendPasswordResetEmail({ to, resetUrl, expiresAt })`  
- **Token Storage:** `src/lib/passwordReset.ts`  
- **Copy:** “Reset your password” with button + fallback link.  
- **Security:** Always returns **202 Accepted**, even for invalid emails (prevents account enumeration).

---

### 5. Password Reset Confirm
- **Trigger:** User visits `/reset-password?token=...` and submits a new password.  
- **Route:** `src/app/api/auth/password-reset/confirm/route.ts`  
- **Helpers:**  
  - `verifyResetToken(raw)`  
  - `consumeResetToken(raw)`  
- **DB Update:** Replaces user password hash (`bcrypt`) and consumes tokens.  
- **Responses:**  
  - `202` → Password updated  
  - `422` → Password too short  
  - `400` → Invalid/expired token  

---

## Admin Alert Emails

### A) New Signup Confirmed
- **Trigger:** User confirms their signup email (magic link).  
- **Route:** `src/app/api/auth/confirm/route.ts`  
- **Helper:** `src/lib/adminAlerts.ts → sendAdminNewSignupAlert`  
- **Recipients:** `SUPERADMIN_EMAILS`  
- **Copy:** “New sign-up by {userEmail}” with dashboard link.  

---

### B) Invite Accepted
- **Trigger:** Invitee accepts an invite and creates their account.  
- **Route:** `src/app/api/auth/accept-invite/route.ts`  
- **Helper:** `src/lib/adminAlerts.ts → sendAdminInviteAcceptedAlert`  
- **Recipients:** `SUPERADMIN_EMAILS`  
- **Copy:** “Invite accepted by {inviteeEmail}” + inviter line.  

---

## Shared Templates & Helpers

- **User-facing templates:** `packages/auth/src/email.ts`
  - `sendMagicLink(to, link)`
  - `sendInviteEmail({ to, token, inviterEmail })`

- **Password reset template:** `src/lib/email.ts`
  - `sendPasswordResetEmail({ to, resetUrl, expiresAt })`

- **Admin alerts:** `src/lib/adminAlerts.ts`
  - `sendAdminNewSignupAlert({ userEmail, appUrl? })`
  - `sendAdminInviteAcceptedAlert({ inviteeEmail, inviterEmail?, appUrl? })`

- **Reset token helpers:** `src/lib/passwordReset.ts`
  - `createResetToken(email)`
  - `verifyResetToken(raw)`
  - `consumeResetToken(raw)`

---

## Dev & Testing Notes

- Without `RESEND_API_KEY`, all email flows log output to console (`console.log` or `console.warn`).  
- Links are built using `NEXT_PUBLIC_APP_URL`; fallback to request host if missing.  
- Token expiry is enforced both by Mongo TTL index and by explicit checks in code.  
- Invite + signup flows also trigger **admin alert emails** if `SUPERADMIN_EMAILS` is set.  

---

## File Map (by flow)

- **Signup:** `src/app/api/auth/signup/route.ts`  
- **Confirm signup:** `src/app/api/auth/confirm/route.ts`  
- **Invite:** `src/app/api/auth/invite/route.ts`  
- **Invite resend:** `src/app/api/auth/invite/resend/route.ts`  
- **Invite accept:** `src/app/api/auth/accept-invite/route.ts`  
- **Password reset request:** `src/app/api/auth/password-reset/request/route.ts`  
- **Password reset confirm:** `src/app/api/auth/password-reset/confirm/route.ts`  
- **Admin alerts:** `src/lib/adminAlerts.ts`  
- **User templates:** `packages/auth/src/email.ts`  
- **Password reset template:** `src/lib/email.ts`  
- **Token helpers:** `src/lib/passwordReset.ts`  

---

_Last updated: 2025-08-19_
