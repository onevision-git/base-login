/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  // Ignore Next.js build output
  testPathIgnorePatterns: ['<rootDir>/.next/'],
  // File extensions Jest will process
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs'],
  // Setup file for extending Jest
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Transform TS/JS files via ts-jest
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest'
  },
  // Allow ts-jest to transform these ESM modules
  transformIgnorePatterns: [
    '/node_modules/(?!(bson|mongodb|mongodb-memory-server)/)'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
