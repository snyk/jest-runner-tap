import type { TestResult } from '@jest/test-result';
import type Runtime from 'jest-runtime';
import { makeParser, translateArray } from './translator';

export async function byRequire(
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const [parser, output] = makeParser();

  const tap = runtime.requireModule(testPath, 'tap');
  tap.pipe(parser);

  runtime.requireModule(testPath);

  await tap.test('jest-tap-bridge is finishing up', async (t: any) => {
    t.ok('finished');
  });

  // endAll:
  //  a) calls the end() on the parser, woo
  //  b) kills anything else in flight, catching our mistakes
  tap.endAll();

  const result = translateArray(output, { strip: 0 });

  result.displayName = testPath;
  result.testFilePath = testPath;

  return result;
}
