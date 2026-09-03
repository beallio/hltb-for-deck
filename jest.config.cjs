/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@decky/api$': '<rootDir>/__mocks__/decky-api.ts',
    },
    globals: {
        'ts-jest': {
            jestCommandLine: 'jest', // Explicitly specify the Jest command
        },
    },
};
