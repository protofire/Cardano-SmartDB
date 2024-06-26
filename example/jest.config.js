
module.exports = {
  preset: 'ts-jest/presets/default-esm',

  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  rootDir: './',
  
  moduleNameMapper: {
    '@dcspark/cardano-multiplatform-lib-browser': '@dcspark/cardano-multiplatform-lib-nodejs',
    '^@/(.*)$': '<rootDir>/$1'
  },
  testRegex: "/__tests__/api.ts$",
  //testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  reporters: [
    'default',
    '<rootDir>/__tests__/csvReporter.js'
  ],
};


// // jest.config.js
// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   testPathIgnorePatterns: ['/node_modules/', '/.next/'],
//   moduleFileExtensions: ['ts', 'tsx', 'js', 'json', 'node'],
//   roots: ['<rootDir>/tests'],
//   transform: {
//       '^.+\\.(ts|tsx)$': 'ts-jest'
//   },
// };
