/** @type {import('jest').Config} */
module.exports = {
    preset: "ts-jest", // Use ts-jest for TypeScript support
    testEnvironment: "jsdom", // Ensures document/window support for React
    transform: {
        "^.+\\.tsx?$": "ts-jest", // Transpile TypeScript files
        "^.+\\.jsx?$": "babel-jest" // Transpile JavaScript files
    },
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], // Ensure TS files are recognized
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/$1" // Adjust based on your project structure
    },
    extensionsToTreatAsEsm: [".ts", ".tsx"], // Ensure Jest handles TS as ES modules
    globals: {
        "ts-jest": {
            useESM: true // Ensure Jest recognizes ES modules
        }
    }
};
