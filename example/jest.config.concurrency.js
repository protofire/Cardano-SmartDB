require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

module.exports = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    runner: 'jest-serial-runner',
    maxWorkers: 1,
    rootDir: './',
    testRegex: '/__tests__/concurrency/.*\\.test\\.ts$',
    preset: 'ts-jest/presets/default-esm',
    setupFiles: ['./__tests__/concurrency/jest.setup.js'], // Añadir setup file
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.json',
                useESM: true,
                supportsDynamicImport: true,
                supportsExportNamespaceFrom: true,
                supportsStaticESM: true,
                supportsTopLevelAwait: true,
            },
        ],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(lucid-cardano|smart-db))', // Asegúrate de que lucid-cardano y smart-db se transforman
    ],
    moduleNameMapper: {
        '^@example/(.*)$': '<rootDir>/$1',
    },
    moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    watchPathIgnorePatterns: ['/.next/'],
};
