/** @type {import('@ts-jest/dist/types').InitialOptionsTsJest} */
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
    '^.+\\.(js)$': 'babel-jest',
  },
  resolver: '<rootDir>/jest-resolver.cjs',
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/(?!(tslib|o1js/node_modules/tslib)/)',
  ],
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  moduleNameMapper: {
    '^(\\.{1,2}/.+)\\.js$': '$1',
    '^@orochi-network/framework$':
      '<rootDir>/../../node_modules/@orochi-network/framework',
    '^@orochi-network/utilities$':
      '<rootDir>/../../node_modules/@orochi-network/utilities',
  },
};
