module.exports = {
  projects: [
    {
      testRunner: '../..',
      testMatch: ['<rootDir>/**/*.js'],
      globals: {
        'jest-runner-tap': {
          tapCommand: ['../../node_modules/.bin/tap', '-R', 'tap'],
        }
      }
    }
  ]
};
