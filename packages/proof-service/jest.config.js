/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  verbose: true,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  modulePaths: ['<rootDir>'],
  testTimeout: 1000000,
  transform: {
    '^.+\\.(t)s$': ['ts-jest', { useESM: true }],
    '^.+\\.(j)s$': 'babel-jest', // Use ts-jest for both .ts and .js files
  },
  resolver: '<rootDir>/jest-resolver.cjs',
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/(?!(tslib|o1js/node_modules/tslib|punycode|tr46|whatwg-url|fecha|no-case|lower-case|mongodb-connection-string-url)/)',
  ],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
};
