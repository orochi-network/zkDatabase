export default {
  verbose: true,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testTimeout: 1000000,
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  transform: {
    '^.+\\.(ts)$': 'ts-jest',
    '^.+\\.(js|mjs)$': 'babel-jest',
  },
  resolver: '<rootDir>/jest-resolver.cjs',
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/(?!(tslib|o1js/node_modules/tslib|punycode|tr46|whatwg-url|fecha|no-case|lower-case|mongodb-connection-string-url|node-fetch|@orochi-network/framework|@orochi-network/utilities|@orochi-network/vault|@orochi-network/queue)/)',
  ],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.+)\\.js$': '$1',
    '^@orochi-network/framework$':
      '<rootDir>/../../node_modules/@orochi-network/framework',
    '^@orochi-network/utilities$':
      '<rootDir>/../../node_modules/@orochi-network/utilities',
    '^@orochi-network/vault$':
      '<rootDir>/../../node_modules/@orochi-network/vault',
    '^@orochi-network/queue$':
      '<rootDir>/../../node_modules/@orochi-network/queue',
    '@common': '<rootDir>/src/common',
    '@helper': '<rootDir>/src/helper',
    '@database': '<rootDir>/src/database',
  },
};
