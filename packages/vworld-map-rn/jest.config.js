/**
 * Lean jest config: no jest-expo / RN preset (those drag in conflicting React
 * copies in this monorepo). Instead `react-native` and the native MapLibre
 * module are mocked so the RN component tree renders in plain Node via
 * react-test-renderer.
 */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/test/jest.setup.js'],
  testMatch: ['<rootDir>/test/**/*.test.tsx'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: {
    '^react-native$': '<rootDir>/test/mocks/react-native.tsx',
    '^@maplibre/maplibre-react-native$': '<rootDir>/test/mocks/maplibre-react-native.tsx',
    // resolve the core package from source so a built dist is not required
    '^vworld-map-core$': '<rootDir>/../vworld-map-core/src/index.ts',
  },
};
