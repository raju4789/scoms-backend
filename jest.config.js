module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/repositories', '<rootDir>/services'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/*.test.ts'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
};
