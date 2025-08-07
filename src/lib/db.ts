// File: src/lib/db.ts

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local',
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache;
}

const globalCache = global as unknown as { mongooseCache: MongooseCache };

if (!globalCache.mongooseCache) {
  globalCache.mongooseCache = { conn: null, promise: null };
}

/**
 * Connects to MongoDB (cached across hot reloads in development).
 */
export async function connect(): Promise<typeof mongoose> {
  if (globalCache.mongooseCache.conn) {
    return globalCache.mongooseCache.conn;
  }

  if (!globalCache.mongooseCache.promise) {
    globalCache.mongooseCache.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseInstance) => {
        return mongooseInstance;
      });
  }

  globalCache.mongooseCache.conn = await globalCache.mongooseCache.promise;
  return globalCache.mongooseCache.conn;
}
