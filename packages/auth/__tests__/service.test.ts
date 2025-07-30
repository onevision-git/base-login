// Increase Jest timeout for MongoMemoryServer startup
jest.setTimeout(60000);

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { signUp, login, getMe, logout, SignUpInput } from '../src/service';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Auth Service functions', () => {
  const userInput: SignUpInput = {
    tenantName: 'Acme Corp',
    tenantDomain: 'acme.com',
    email: 'alice@acme.com',
    password: 'P@ssw0rd!',
  };

  it('signUp should create tenant & user and return token + user', async () => {
    const { token, user } = await signUp(userInput);
    expect(typeof token).toBe('string');
    expect(user.email).toBe(userInput.email);
    expect(user.tenantId).toBeDefined();
  });

  it('login should authenticate existing user', async () => {
    // First sign up
    await signUp(userInput);
    const { token, user } = await login({
      email: userInput.email,
      password: userInput.password,
    });
    expect(typeof token).toBe('string');
    expect(user.email).toBe(userInput.email);
  });

  it('login should reject wrong password', async () => {
    await signUp(userInput);
    await expect(
      login({ email: userInput.email, password: 'wrongPw' }),
    ).rejects.toThrow('Invalid credentials');
  });

  it('getMe should return the user for a valid token', async () => {
    const { token, user: signedUpUser } = await signUp(userInput);
    const currentUser = await getMe(token);
    expect(currentUser._id.toString()).toBe(signedUpUser._id.toString());
  });

  it('getMe should throw for invalid token', async () => {
    await expect(getMe('not.a.valid.token')).rejects.toThrow();
  });

  it('logout should always return true', () => {
    expect(logout()).toBe(true);
  });
});
