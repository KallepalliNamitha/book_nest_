export default {
  // Test environment
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],

  // Module mapping
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@context/(.*)$': '<rootDir>/src/context/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1'
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.svg$': 'jest-transform-stub'
  },

  // Test patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx}',
    '!src/mocks/**',
    '!src/test/**'
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test environment configuration
  globals: {
    'process.env': {
      NODE_ENV: 'test',
      API_URL: 'http://localhost:5001'
    }
  },

  // Timeout configuration
  testTimeout: 10000,

  // Watch configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Error handling
  bail: 1,
  verbose: true,

  // Performance configuration
  maxWorkers: '50%',
  maxConcurrency: 5,

  // Snapshot configuration
  snapshotSerializers: ['jest-serializer-html'],
  
  // Module resolution
  moduleDirectories: ['node_modules', 'src'],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],

  // Reset mocks between tests
  resetMocks: false,
  restoreMocks: true,
  clearMocks: true,

  // Display configuration
  notify: true,
  notifyMode: 'failure-change',

  // Cache configuration
  cacheDirectory: '.jest-cache',
  
  // Custom resolver
  resolver: undefined,

  // Custom runners
  runner: 'jest-runner',

  // Custom reporters
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'coverage/junit',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ]
}; 