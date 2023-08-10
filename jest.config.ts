import type { JestConfigWithTsJest } from 'ts-jest'

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  clearMocks: true,
  testMatch: ['**/*.test.ts'],
  verbose: true
}

export default jestConfig
