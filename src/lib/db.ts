// File: src/lib/db.ts
import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: MongooseCache | undefined;
}

// Singleton cache on the global to survive HMR / serverless reuse
const cached: MongooseCache = globalThis._mongoose ?? {
  conn: null,
  promise: null,
};
globalThis._mongoose = cached;

export async function connect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = (process.env.MONGODB_URI ?? '').trim();
  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Set it in your environment (e.g. .env.local or CI secrets).',
    );
  }

  // Safe to call repeatedly; applies once per process
  mongoose.set('strictQuery', true);

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnect(): Promise<void> {
  // Only disconnect during tests to avoid tearing down shared pools in dev/prod
  if (process.env.NODE_ENV === 'test') {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
  }
}
