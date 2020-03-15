import { createEmptyTestResult, TestResult } from '@jest/test-result';
import type Runtime from 'jest-runtime';
import { timeout } from 'promise-timeout';
import type TapParser from 'tap-parser';
import { makeParser, pushExceptionFailure, translateArray } from './translator';


export async function byRequire(
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const [parser, output] = makeParser();

  const result = createEmptyTestResult();

  result.failureMessage = '';
  result.displayName = testPath;
  result.testFilePath = testPath;

  try {
    await timeout(callTap(runtime, testPath, parser), 1_000);
  } catch (err) {
    result.testExecError = err;
    result.leaks = true;

    pushExceptionFailure(result, testPath, err, 'require');
  }

  try {
    translateArray(result, output, {strip: 0});
  } catch (err) {
    if (!result.testExecError) {
      result.testExecError = err;
    }
    pushExceptionFailure(result, testPath, err, 'translate');
  }

  return result;
}

async function callTap(runtime: Runtime, testPath: string, parser: TapParser): Promise<void> {
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
}
