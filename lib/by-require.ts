import type { TestResult } from '@jest/test-result';
import type Runtime from 'jest-runtime';
import { timeout } from 'promise-timeout';
import type TapParser from 'tap-parser';
import { defaultTestResult, makeParser, pushExceptionFailure, translateArray } from './translator';
import {TapBridgeConfig} from './config';


export async function byRequire(
  config: TapBridgeConfig,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const [parser, output] = makeParser();

  const result = defaultTestResult(testPath);

  try {
    await timeout(callTap(runtime, testPath, parser), config.timeoutMillis);
  } catch (err) {
    pushExceptionFailure(result, err, 'require');
  }

  translateArray(result, output, {strip: 0});

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
