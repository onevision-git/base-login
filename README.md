### System Admin Accounts

- Define superadmin emails in your environment variables.
- Local development: add them to `.env.local`  
- Production: set them in Vercel Project Settings → Environment Variables

Example:
SUPERADMIN_EMAILS=matt@onevision.co.uk,alice@partner.com

Any user who signs in with one of these emails will see the **System Settings** page.
