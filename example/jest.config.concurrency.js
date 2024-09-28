module.exports = {
    coverageProvider: 'v8',
    // testEnvironment: 'node',
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
        // '^.+\\.module\\.(css|sass|scss)$',
    ],
    moduleNameMapper: {
        // '^.+\\.module\\.(css|sass|scss)$': '<rootDir>/node_modules/next/dist/build/jest/object-proxy.js',
        // '^.+\\.(css|sass|scss)$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/styleMock.js',
        // '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/fileMock.js',
        // '^.+\\.(svg)$': '<rootDir>/node_modules/next/dist/build/jest/__mocks__/fileMock.js',
        // '^lucid-cardano$': '<rootDir>/node_modules/lucid-cardano',
        // '@dcspark/cardano-multiplatform-lib-browser': '@dcspark/cardano-multiplatform-lib-nodejs',
        //'^lucid-cardano$': '<rootDir>/node_modules/lucid-cardano/esm/mod.js',
        // '^smart-db/(.*)$': '<rootDir>/node_modules/@manupadilla/smart-db/dist/$1',
        // '^smart-db$': '<rootDir>/node_modules/@manupadilla/smart-db/dist',
        '^@example/(.*)$': '<rootDir>/$1',
    },
    moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
    testPathIgnorePatterns: ['/node_modules/', '/.next/'],
    watchPathIgnorePatterns: ['/.next/'],
    // Habilitar soporte experimental de módulos ES
    // extensionsToTreatAsEsm: ['.ts', '.tsx'],
};
