// TODO:
module.exports = {
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMappler: {
    '^test/(.*)': '<rootDir>/test/$1',
  },

  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['<rootDir>[/\\\\](node_modules)[/\\\\]'],
  transformIgnorePatterns: ['/node-modules/'],
  transform: {
    '\\.[jt]sx?$': 'babel-jest',
  },
};
