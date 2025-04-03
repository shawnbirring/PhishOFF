module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'], // Add 'ts' and 'tsx' here
  testMatch: [
    '**/extension/__tests__/**/*.test.{js,ts,tsx}', 
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest',  // Use ts-jest to handle TypeScript files (.ts and .tsx)
    '^.+\\.jsx?$': 'babel-jest', // Keep babel-jest for JavaScript and JSX
  },
  preset: 'ts-jest',
  verbose: true,
};
