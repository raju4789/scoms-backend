module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/repositories', '<rootDir>/src/services', '<rootDir>/src/utils', '<rootDir>/src/routes'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleDirectories: ['node_modules', 'src'],
};
