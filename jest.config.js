/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/.next/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    // Transform TS/JS and also ESM .mjs via ts-jest
    '^.+\\.[tj]sx?$': 'ts-jest',
    '^.+\\.mjs$': 'ts-jest',
  },
  // Do _not_ ignore these ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(bson|mongodb|mongodb-memory-server)/)',
  ],
  // Map Next.js `@/` imports to the project root
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
};
