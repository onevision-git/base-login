// packages/auth/src/service.ts
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Company } from './models/Company';
import { User } from './models/User';
import { sendMagicLink } from './email';

const JWT_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function createUserAndCompany(orgName: string, email: string) {
  await mongoose.connect(process.env.MONGODB_URI!);

  // Step 1: Create or find company
  const domain = email.split('@')[1];
  let company = await Company.findOne({ domain });

  if (!company) {
    company = await Company.create({
      name: orgName,
      domain,
      maxUsers: 3,
    });
  }

  // Step 2: Check for existing user
  let user = await User.findOne({ email });
  if (user) {
    throw new Error('User already exists');
  }

  // Step 3: Create user as master + admin
  user = await User.create({
    email,
    companyId: company._id,
    isMaster: true,
    emailVerified: false,
    role: 'admin',
    passwordHash: 'placeholder', // real password can be added later
  });

  // Step 4: Generate magic link token
  const token = jwt.sign({ email: user.email, userId: user._id }, JWT_SECRET, {
    expiresIn: '24h',
  });

  const magicLink = `${APP_URL}/confirm?token=${token}`;

  // Step 5: Send email via Resend
  await sendMagicLink(email, magicLink);

  return { success: true, magicLink }; // for debugging purposes only
}
