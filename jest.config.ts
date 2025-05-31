import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: [
    '<rootDir>/src/repositories',
    '<rootDir>/src/services',
    '<rootDir>/src/utils',
    '<rootDir>/src/routes',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleDirectories: ['node_modules', 'src'],
};

export default config;
