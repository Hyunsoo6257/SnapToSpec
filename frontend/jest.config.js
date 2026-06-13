/**
 * Jest configuration for the frontend workspace.
 *
 * Without an explicit config, Jest's default testMatch treats any file named
 * `spec.ts`/`test.ts` (e.g. the `src/types/spec.ts` type definitions) as a test
 * suite and fails to parse its TypeScript. Mirror the backend convention and
 * only collect dotted `*.spec.*` / `*.test.*` files, transformed via ts-jest.
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts', 'tsx'],
  rootDir: 'src',
  testRegex: '.*\\.(spec|test)\\.tsx?$',
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
