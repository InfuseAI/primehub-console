module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  moduleFileExtensions: ['js', 'ts', 'tsx'],
  moduleNameMapper: {
    '^test/(.*)': '<rootDir>/test/$1',
    '^utils/(.*)': '<rootDir>/src/utils/$1',
    '^components/(.*)': '<rootDir>/src/components/$1',
    '^containers/(.*)': '<rootDir>/src/containers/$1',
    '^cms-layouts/(.*)': '<rootDir>/src/cms-layouts/$1',
    '^cms-components/(.*)': '<rootDir>/src/cms-components/$1',
    '^cms-toolbar/(.*)': '<rootDir>/src/cms-toolbar/$1',
    '^styledShare/(.*)': '<rootDir>/src/styled_share/$1',
    '^context/(.*)': '<rootDir>/src/context/$1',
    '^ee/(.*)': '<rootDir>/src/ee/$1',
    '^constant/(.*)': '<rootDir>/src/constant/$1',
    '^interfaces/(.*)': '<rootDir>/src/interfaces/$1',
    '^queries/(.*)': '<rootDir>/src/queries/$1',
    '^@types/(.*)': '<rootDir>/src/@types/$1',
    '^images/(.*)': '<rootDir>/test/__mocks__/fileMocks.js',
    '\\.(css|less)$': '<rootDir>/test/__mocks__/fileMocks.js',
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/test__mocks__/fileMocks.js',
  },

  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],

  testEnvironment: 'jsdom',
  testURL: 'http://localhost/',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/schema'],
  transformIgnorePatterns: ['/node_modules/', '/dist/', '/schema'],
  transform: {
    '\\.(gql|graphql)$': 'jest-transform-graphql',
    '\\.tsx?$': 'ts-jest',
    '\\.[j]sx?$': 'babel-jest',
  },
};
