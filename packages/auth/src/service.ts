// packages/auth/src/service.ts

import Tenant from './models/Tenant';
import User, { IUser } from './models/User';
import { hashPassword, comparePassword } from './password';
import { signAccessToken, verifyAccessToken } from './jwt';
import { sendMagicLinkEmail } from './email';

export async function sendLoginLink(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user) throw new Error('No user found');
  const token = signAccessToken(
    { userId: user._id.toString(), tenantId: user.tenantId.toString() },
    '15m',
  );
  await sendMagicLinkEmail(email, token);
}

export interface SignUpInput {
  tenantName: string;
  tenantDomain: string;
  email: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: IUser;
}

/**
 * Create a new Tenant + User, then issue a JWT.
 */
export async function signUp(data: SignUpInput): Promise<AuthResult> {
  const tenant = await Tenant.create({
    name: data.tenantName,
    domain: data.tenantDomain,
  });
  const passwordHash = await hashPassword(data.password);
  const user = await User.create({
    tenantId: tenant._id,
    email: data.email,
    passwordHash,
  });
  const token = signAccessToken(
    { userId: user._id.toString(), tenantId: tenant._id.toString() },
    '1h',
  );
  return { token, user };
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Validate credentials, then issue a JWT.
 */
export async function login(data: LoginInput): Promise<AuthResult> {
  const user = await User.findOne({ email: data.email });
  if (!user) throw new Error('Invalid credentials');
  const valid = await comparePassword(data.password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');
  const token = signAccessToken(
    { userId: user._id.toString(), tenantId: user.tenantId.toString() },
    '1h',
  );
  return { token, user };
}

/**
 * Given a JWT, return the current user.
 */
export async function getMe(token: string): Promise<IUser> {
  const payload = (await verifyAccessToken(token)) as { userId: string };
  const user = await User.findById(payload.userId);
  if (!user) throw new Error('Not authenticated');
  return user;
}

/**
 * For stateless JWT, logout is a no-op server-side.
 */
export function logout(): boolean {
  return true;
}
