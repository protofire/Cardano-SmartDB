require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

module.exports = {
    preset: 'ts-jest/presets/default-esm',
    transform: {
        '^.+\\.ts?$': ['ts-jest', { useESM: true }],
    },
    rootDir: './',
    moduleNameMapper: {
        '@dcspark/cardano-multiplatform-lib-browser': '@dcspark/cardano-multiplatform-lib-nodejs',
        '^@/(.*)$': '<rootDir>/$1',
    },
    testRegex: '/__tests__/performance/.*\\.test\\.ts$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    reporters: ['default', '<rootDir>/__tests__/performance/csvReporter.js'],
};
