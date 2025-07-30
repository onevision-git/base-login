// packages/auth/src/index.ts

export * from './service';
export * from './email';
export * from './jwt';
export * from './password';

export function helloAuth(): string {
  return 'hello-auth';
}
