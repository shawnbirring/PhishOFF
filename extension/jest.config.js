/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',  // ts-jest handles TypeScript transformation
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // ts-jest for TypeScript files
    '^.+\\.(js|jsx)$': 'babel-jest', // babel-jest for JavaScript files
  },
  verbose: true,
};
