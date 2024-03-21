
module.exports = {
  preset: 'ts-jest/presets/default-esm',

  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  moduleNameMapper: {
    '@dcspark/cardano-multiplatform-lib-browser': '@dcspark/cardano-multiplatform-lib-nodejs',
    '^@/(.*)$': '<rootDir>/$1'
  },

  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};