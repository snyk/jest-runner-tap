module.exports = {
  projects: [
    {
      preset: 'ts-jest',
      globals: {
        'ts-jest': {
          isolatedModules: true,
        },
      },
      displayName: 'hack',
      testMatch: ['**/*.?s'],
      testRunner: '../../dist/by-require',
    },
  ],
};
