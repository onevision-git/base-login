// src/lib/db.ts
import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis._mongoose ?? {
  conn: null,
  promise: null,
};
globalThis._mongoose = cached;

export async function connect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'MONGODB_URI is not set. Define it in your environment (.env.local).',
    );
  }

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
  if (process.env.NODE_ENV === 'test') {
    await mongoose.connection.close();
    cached.conn = null;
    cached.promise = null;
  }
}
