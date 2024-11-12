/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  verbose: true,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['<rootDir>/build/'],
  testTimeout: 1000000,
  transform: {
    '^.+\\.(t)s$': ['ts-jest', { useESM: true }],
    '^.+\\.(j)s$': 'babel-jest', // Use ts-jest for both .ts and .js files
  },
  resolver: '<rootDir>/jest-resolver.cjs',
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/(?!(tslib|o1js/node_modules/tslib|punycode|tr46|whatwg-url|fecha|no-case|lower-case|mongodb-connection-string-url|node-fetch)/)',
  ],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.+)\\.js$': '$1',
    '^@orochi-network/framework$':
      '<rootDir>/../../node_modules/@orochi-network/framework',
    '^@orochi-network/utilities$':
      '<rootDir>/../../node_modules/@orochi-network/utilities',
    '^graphql$': 'graphql/index.js',
    '^@orochi-network/vault$':
      '<rootDir>/../../node_modules/@orochi-network/vault',
    '^@orochi-network/queue$':
      '<rootDir>/../../node_modules/@orochi-network/queue',
  },
};
