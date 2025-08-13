// src/lib/mongodb.ts
// Reusable, hot-reload-safe MongoDB connection for Next.js App Router.

import { MongoClient, Db, Collection } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI is not set. Add it to your .env.local');
}

type GlobalWithMongo = typeof globalThis & {
  __MONGO_CLIENT__?: MongoClient;
  __MONGO_DB__?: Db;
};

const g = globalThis as GlobalWithMongo;

let clientPromise: Promise<MongoClient> | null = null;
let dbPromise: Promise<Db> | null = null;

async function connectClient(): Promise<MongoClient> {
  if (g.__MONGO_CLIENT__) return g.__MONGO_CLIENT__;
  const client = new MongoClient(uri, {});
  await client.connect();
  g.__MONGO_CLIENT__ = client;
  return client;
}

function resolveDbNameFromUri(mongoUri: string): string | undefined {
  try {
    const afterSlash = mongoUri.split('/').slice(3).join('/');
    const dbAndRest = afterSlash.split('?')[0];
    const dbName = dbAndRest || '';
    const firstSegment = dbName.split('/')[0];
    return firstSegment || undefined;
  } catch {
    return undefined;
  }
}

async function connectDb(): Promise<Db> {
  if (g.__MONGO_DB__) return g.__MONGO_DB__;
  const client = await connectClient();

  const envDb = process.env.MONGODB_DB?.trim();
  const parsedDb = resolveDbNameFromUri(uri);
  const dbName = envDb || parsedDb || 'base-login';

  const db = client.db(dbName);
  g.__MONGO_DB__ = db;
  return db;
}

export async function getClient(): Promise<MongoClient> {
  if (!clientPromise) clientPromise = connectClient();
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  if (!dbPromise) dbPromise = connectDb();
  return dbPromise;
}

// Changed default generic from `any` to `unknown`
export async function getCollection<T = unknown>(
  name: string,
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}
