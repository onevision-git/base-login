// File: packages/auth/src/service.ts

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Company from '@models/Company';
import User from '@models/User';

// ⚠️ Build-safety:
// - No top-level env reads or throws.
// - Lazy-import email helper to avoid import-time env access.

function requireEnv(
  name: 'MONGODB_URI' | 'JWT_SECRET' | 'NEXT_PUBLIC_APP_URL',
): string {
  const val = process.env[name];
  if (!val || !val.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val.trim();
}

function appUrlNoTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

/**
 * Creates a new company (if needed) and an admin user, then
 * sends a magic-link email for initial sign-up.
 */
export async function createUserAndCompany(
  orgName: string,
  email: string,
): Promise<{ success: boolean; magicLink: string }> {
  // 1) Load env at runtime (safe for build)
  const MONGODB_URI = requireEnv('MONGODB_URI');
  const JWT_SECRET = requireEnv('JWT_SECRET');
  const NEXT_PUBLIC_APP_URL = requireEnv('NEXT_PUBLIC_APP_URL');

  // 2) Connect to MongoDB (idempotent in mongoose)
  await mongoose.connect(MONGODB_URI);

  // 3) Lookup or create the company based on email domain
  const domain = (email.split('@')[1] ?? '').toLowerCase();
  if (!domain) throw new Error('Invalid email domain');

  let company = await Company.findOne({ domain });
  if (!company) {
    company = await Company.create({
      name: orgName,
      domain,
      maxUsers: 3,
    });
  }

  // 4) Prevent duplicate users
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('User already exists');
  }

  // 5) Create the master/admin user
  const user = await User.create({
    email,
    companyId: company._id,
    isMaster: true,
    emailVerified: false,
    role: 'admin',
    passwordHash: 'placeholder',
  });

  // 6) Generate a JWT magic link
  const token = jwt.sign(
    { email: user.email, userId: user._id.toString() },
    JWT_SECRET,
    { expiresIn: '24h' },
  );
  const magicLink = `${appUrlNoTrailingSlash(NEXT_PUBLIC_APP_URL)}/confirm?token=${encodeURIComponent(
    token,
  )}`;

  // 7) Lazy-import the email helper and send
  const { sendMagicLink } = await import('./email');
  await sendMagicLink(email, magicLink);

  return { success: true, magicLink };
}

/**
 * Returns the current number of active (verified) users in a company,
 * that company’s maxUsers, and whether this admin can invite more.
 */
export async function getInviteInfo(
  companyId: string,
  userId: string,
): Promise<{ userCount: number; maxUsers: number; canInvite: boolean }> {
  // Load env at runtime (safe for build)
  const MONGODB_URI = requireEnv('MONGODB_URI');

  // Ensure DB connection
  await mongoose.connect(MONGODB_URI);

  // Count verified users
  const userCount = await User.countDocuments({
    companyId,
    emailVerified: true,
  });

  // Load the company's maxUsers
  const company = await Company.findById(companyId).select('maxUsers');
  const maxUsers = company?.maxUsers ?? 0;

  // Check if inviter is an admin
  const inviter = await User.findById(userId).select('role');
  const isAdmin = inviter?.role === 'admin';

  return {
    userCount,
    maxUsers,
    canInvite: Boolean(isAdmin && userCount < maxUsers),
  };
}
