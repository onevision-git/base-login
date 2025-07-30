// packages/auth/src/service.ts
import Tenant from './models/Tenant';
import User from './models/User';
import { hashPassword, comparePassword } from './password';
import { signAccessToken, verifyAccessToken } from './jwt';
import { sendMagicLinkEmail } from './email';
import { Types } from 'mongoose';
export async function signUp(data) {
    const tenant = await Tenant.create({
        name: data.tenantName,
        domain: data.tenantDomain,
    });
    const passwordHash = await hashPassword(data.password);
    const userDoc = await User.create({
        tenantId: tenant._id,
        email: data.email,
        passwordHash,
    });
    const userId = userDoc._id.toString();
    const tenantId = tenant._id.toString();
    const token = signAccessToken({ userId, tenantId }, '1h');
    return { token, user: userDoc.toObject() };
}
export async function login(data) {
    const userDoc = await User.findOne({ email: data.email });
    if (!userDoc)
        throw new Error('Invalid credentials');
    const valid = await comparePassword(data.password, userDoc.passwordHash);
    if (!valid)
        throw new Error('Invalid credentials');
    const userId = userDoc._id.toString();
    const tenantId = userDoc.tenantId.toString();
    const token = signAccessToken({ userId, tenantId }, '1h');
    return { token, user: userDoc.toObject() };
}
export async function getMe(token) {
    const payload = verifyAccessToken(token);
    const id = payload.userId;
    if (!Types.ObjectId.isValid(id))
        throw new Error('Invalid token');
    const userDoc = await User.findById(new Types.ObjectId(id));
    if (!userDoc)
        throw new Error('Not authenticated');
    return userDoc.toObject();
}
export function logout() {
    return true;
}
export async function sendLoginLink(email) {
    const userDoc = await User.findOne({ email });
    if (!userDoc)
        throw new Error('No user found');
    const userId = userDoc._id.toString();
    const tenantId = userDoc.tenantId.toString();
    const token = signAccessToken({ userId, tenantId }, '15m');
    await sendMagicLinkEmail(email, token);
}
