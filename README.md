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


#### How does it work?

 * [`lib/index`](lib/index.ts) exposes a function which matches `jest`'s `runner`
    interface. This function is `bySpawn`.

 * [`bySpawn`](lib/by-spawn.ts) parses config, then executes `tap`, sends the
    output to `BuildTree`, and then `translateResult`s.

 * [`BuildTree`](lib/tree/builder.ts) builds an in-memory tree of `tap` tests,
    so asserts belong to tests, and child tests belong to parent tests.

 * [`translateResult`](lib/tree/index.ts) visits every item in the tree, and
    builds the result, e.g. by `pushTestResult` (which `render*`s parts), and
    `pushProcessFailure` if the whole process fails.

 * [`renderDiag`](lib/render/diag.ts) tries to prettify the tap output by calling
    `jest` helper functions, and falls back to just showing the `tap` output if it
    didn't do a good job.


If a test is missing, it's possible `BuildTree` is discarding it (thinking it's a
`describe` block?), or the tap stream has totally failed to parse (we use `tap-parser`).

If the diagnosis is ugly or confusing, it's probably worth adding a special case to
`renderDiag` to just not try and guess in that case. Or a better renderer!


#### Risk?

We could miss failing tests. If you trust `tap`'s exit code, this is
pretty low risk. The exit code is added as a failure after the regular
processing.

We could confuse diagnosis of a failure, by misrepresenting the error,
or by crashing while parsing an error message. 

We could "lie" to `jest`, for example, we allow tests with no assertions,
which `jest` might (correcly?) reject as "empty describe block", see
[empty-describe.test.js](test/fixtures/empty-describe.test.js), which we
consider valid. This is necessary because many(tm) tests only check for
throwing, and the convention in `tap` is to not catch these; and just let
them escape. c.f. [supertest](https://github.com/visionmedia/supertest#example)


#### License, contributing?

MIT, Apache2, or ask! Yes please, github.
