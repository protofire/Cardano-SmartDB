
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
    testRegex: '/__tests__/api/.*\\.test\\.ts$', // Matches test files in the specified directory
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    reporters: ['default', '<rootDir>/__tests__/api/csvReporter.js'],

    // Add coverage options
    collectCoverageFrom: [
        'src/**/*.ts', // Include all TypeScript files in the 'src' directory
        '!src/**/*.test.ts', // Exclude test files
        '!src/**/index.ts', // Exclude index files if not directly testable
        'node_modules/smart-db/**/*.ts', // Include SmartDB library files
        '!node_modules/smart-db/**/*.test.ts', // Exclude any test files within SmartDB
    ],
    coverageDirectory: './coverage', // Directory to save coverage reports
    coverageReporters: ['text', 'html'], // Output formats: 'text' for CLI, 'html' for browser
};