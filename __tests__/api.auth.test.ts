// __tests__/api.auth.test.ts
jest.setTimeout(30000);

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { POST as signupRoute } from '../src/app/api/auth/signup/route';
import { POST as loginRoute } from '../src/app/api/auth/login/route';
import { GET as meRoute } from '../src/app/api/auth/me/route';
import { POST as logoutRoute } from '../src/app/api/auth/logout/route';

describe('Auth API routes', () => {
  let mongoServer: MongoMemoryServer;
  let token: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clear DB between tests
    for (const key in mongoose.connection.collections) {
      await mongoose.connection.collections[key].deleteMany({});
    }
  });

  it('POST /api/auth/signup → 201 + token', async () => {
    const req = new Request('http://localhost/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tenantName: 'TestCo',
        tenantDomain: 'test.co',
        email: 'bob@test.co',
        password: 'Secret123',
      }),
    });
    const res = await signupRoute(req as any);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(typeof json.token).toBe('string');
    token = json.token;
  });

  it('POST /api/auth/login → 200 + token', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'bob@test.co', password: 'Secret123' }),
    });
    const res = await loginRoute(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.token).toBe('string');
    token = json.token;
  });

  it('GET /api/auth/me → 200 + user', async () => {
    const req = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    });
    const res = await meRoute(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.email).toBe('bob@test.co');
  });

  it('POST /api/auth/logout → 200 + success', async () => {
    const res = await logoutRoute();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
