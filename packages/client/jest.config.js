// TODO:
module.exports = {
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '^test/(.*)': '<rootDir>/test/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  verbose: true,
  testURL: 'http://localhost/',

  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['<rootDir>[/\\\\](node_modules)[/\\\\]'],
  transformIgnorePatterns: ['/node-modules/', '/dist/'],
  transform: {
    '\\.tsx?$': 'ts-jest',
    // '\\.jsx?$': 'babel-jest',
    '\\.[jt]sx?$': 'babel-jest',
  },
};
