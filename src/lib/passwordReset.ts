// src/lib/passwordReset.ts
// Helpers for password reset tokens (create / verify / consume)

import { randomBytes, createHash } from 'crypto';
import type { IndexDescription } from 'mongodb';
import { getCollection } from './mongodb';

const COLLECTION_NAME = 'password_reset_tokens';

export type ResetTokenDoc = {
  tokenHash: string;
  email: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
};

// 60 minutes default validity (tweak as needed)
const DEFAULT_TTL_MINUTES = parseInt(
  process.env.RESET_TOKEN_TTL_MINUTES || '60',
  10,
);

// --- small utils ---

function toBase64Url(buf: Buffer): string {
  // base64url (RFC 4648 §5): +/ -> -_, strip =
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

async function ensureIndexes() {
  const col = await getCollection<ResetTokenDoc>(COLLECTION_NAME);

  // Use IndexDescription (current driver type)
  const uniqueTokenHash: IndexDescription = {
    key: { tokenHash: 1 },
    name: 'uniq_tokenHash',
    unique: true,
  };

  // TTL index on expiresAt; expireAfterSeconds: 0 -> expire at the timestamp
  const ttlIndex: IndexDescription = {
    key: { expiresAt: 1 },
    name: 'ttl_expiresAt',
    expireAfterSeconds: 0,
  };

  await col.createIndexes([uniqueTokenHash, ttlIndex]);
}

// --- public API ---

/**
 * Creates a new password reset token for the given email.
 * Returns the RAW token (base64url) that should be sent to the user.
 * Only the SHA-256 hash is stored in MongoDB.
 */
export async function createResetToken(
  email: string,
  ttlMinutes = DEFAULT_TTL_MINUTES,
): Promise<{
  token: string; // raw base64url token to include in reset link
  expiresAt: Date;
}> {
  if (!email || !email.trim()) {
    throw new Error('Email is required to create a reset token.');
  }

  await ensureIndexes();

  const raw = toBase64Url(randomBytes(32));
  const tokenHash = sha256(raw);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  const col = await getCollection<ResetTokenDoc>(COLLECTION_NAME);
  await col.insertOne({
    tokenHash,
    email: email.trim().toLowerCase(),
    createdAt: now,
    expiresAt,
    used: false,
  });

  return { token: raw, expiresAt };
}

/**
 * Looks up a token by its RAW value and verifies it is not expired/used.
 * Returns the stored info (minus the hash) or null if invalid.
 */
export async function verifyResetToken(rawToken: string): Promise<{
  email: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
} | null> {
  if (!rawToken || !rawToken.trim()) return null;

  const tokenHash = sha256(rawToken.trim());
  const col = await getCollection<ResetTokenDoc>(COLLECTION_NAME);

  const doc = await col.findOne({ tokenHash });
  if (!doc) return null;

  // Defensive checks (TTL should remove expired docs, but don’t rely on it)
  const now = Date.now();
  if (doc.used) return null;
  if (doc.expiresAt.getTime() <= now) return null;

  return {
    email: doc.email,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
    used: doc.used,
  };
}

/**
 * Consumes (invalidates) a token by its RAW value. Idempotent: returns true if a doc was updated.
 */
export async function consumeResetToken(rawToken: string): Promise<boolean> {
  if (!rawToken || !rawToken.trim()) return false;

  const tokenHash = sha256(rawToken.trim());
  const col = await getCollection<ResetTokenDoc>(COLLECTION_NAME);

  const now = new Date();
  const result = await col.updateOne(
    {
      tokenHash,
      used: false,
      expiresAt: { $gt: now },
    },
    {
      $set: { used: true, usedAt: now },
    },
  );

  return result.modifiedCount > 0;
}
