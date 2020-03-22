module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  snapshotSerializers: [
    'pretty-format/build/plugins/ConvertAnsi.js',
  ],
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
};
