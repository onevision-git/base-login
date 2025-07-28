// packages/auth/__tests__/models.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import User, { IUser } from '../src/models/User';
import Tenant, { ITenant } from '../src/models/Tenant';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  // Clear collections between tests
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Mongoose Models Integration', () => {
  it('should create and retrieve a Tenant document', async () => {
    const tenantData = { name: 'TestCorp', domain: 'testcorp.com' };
    const tenant = await Tenant.create(tenantData);
    expect(tenant._id).toBeDefined();
    expect(tenant.name).toBe(tenantData.name);
    expect(tenant.domain).toBe(tenantData.domain);

    const found = await Tenant.findById(tenant._id);
    expect(found).not.toBeNull();
    expect((found as ITenant).domain).toBe('testcorp.com');
  });

  it('should create a User linked to a Tenant', async () => {
    // First create a tenant
    const tenant = await Tenant.create({
      name: 'TestCorp',
      domain: 'testcorp.com',
    });

    // Then create a user under that tenant
    const userData: Partial<IUser> = {
      tenantId: tenant._id.toString(),
      email: 'user@test.com',
      passwordHash: 'hashedpw',
    };
    const user = await User.create(userData);
    expect(user._id).toBeDefined();
    expect(user.tenantId.toString()).toBe(tenant._id.toString());
    expect(user.email).toBe(userData.email);

    const foundUser = await User.findOne({ email: 'user@test.com' });
    expect(foundUser).not.toBeNull();
    expect((foundUser as IUser).tenantId.toString()).toBe(
      tenant._id.toString(),
    );
  });
});
