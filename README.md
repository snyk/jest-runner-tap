## jest-runner-tap

Run `tap`, and render the output for `jest`.


#### Why?

You can run `tap` and `jest` tests in parallel from the same
unified interface, and get the performance benefits, (e.g.
`jest` knowing which tests to run first), and the reporting
benefits (i.e. use anything that supports `jest`).


#### How?

`jest` supports `projects`, which can have totally different
configurations:

```javascript
module.exports = {
  projects: [
    {
      // "spec" files run with jest as normal
      displayName: 'jest',
      testMatch: ['<rootDir>/test/**/*.spec.ts'],
      preset: 'ts-jest',
    },
    {
      // "test" files run with tap
      testRunner: 'jest-runner-tap',
      testMatch: ['<rootDir>/**/*.test.js'],
    }
  ]
};
```


#### Config?

You can set a `tapCommand`, e.g. "run an existing wrapper script,
but with a timeout".

Note that the command must produce "tap" output, but anything else
goes.

```
globals: {
  'jest-runner-tap': {
    'tapCommand': ['<rootDir>/tap', '-R', 'tap', '--timeout', '240'],
  }
}        
```

#### License, contributing?

MIT, Apache2, or ask! Yes please, github.
