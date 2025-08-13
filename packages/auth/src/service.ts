// File: packages/auth/src/service.ts

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Company from '../../../src/models/Company';
import User from '../../../src/models/User';
import { sendMagicLink } from './email';

// Validate and load environment variables
const MONGODB_URI = process.env.MONGODB_URI!;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

if (!MONGODB_URI || !ACCESS_TOKEN_SECRET || !NEXT_PUBLIC_APP_URL) {
  throw new Error(
    'Missing required environment variables: MONGODB_URI, ACCESS_TOKEN_SECRET, NEXT_PUBLIC_APP_URL',
  );
}

/**
 * Creates a new company (if needed) and an admin user, then
 * sends a magic-link email for initial sign-up.
 */
export async function createUserAndCompany(
  orgName: string,
  email: string,
): Promise<{ success: boolean; magicLink: string }> {
  // 1. Connect to MongoDB
  await mongoose.connect(MONGODB_URI);

  // 2. Lookup or create the company based on email domain
  const domain = email.split('@')[1];
  let company = await Company.findOne({ domain });
  if (!company) {
    company = await Company.create({
      name: orgName,
      domain,
      maxUsers: 3,
    });
  }

  // 3. Prevent duplicate users
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error('User already exists');
  }

  // 4. Create the master/admin user
  const user = await User.create({
    email,
    companyId: company._id,
    isMaster: true,
    emailVerified: false,
    role: 'admin',
    passwordHash: 'placeholder',
  });

  // 5. Generate a JWT magic link
  const token = jwt.sign(
    { email: user.email, userId: user._id.toString() },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '24h' },
  );
  const magicLink = `${NEXT_PUBLIC_APP_URL}/confirm?token=${token}`;

  // 6. Send via your email helper
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
