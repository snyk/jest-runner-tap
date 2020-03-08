import { Config } from '@jest/types';
import { createEmptyTestResult, TestResult } from '@jest/test-result';
import { JestEnvironment } from '@jest/environment';
import Runtime = require('jest-runtime');
import { Writable } from 'stream';

async function byRequire(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const tap = runtime.requireModule(require.resolve('tap'));
  tap.pipe(
    new Writable({
      write(
        chunk: any,
        encoding: string,
        callback: (error?: Error | null) => void,
      ): void {
        console.log(chunk.toString());
        callback(null);
      },
    }),
  );

  runtime.requireModule(testPath);

  await tap.test('jest-tap-bridge is finishing up', async (t: any) => {
    t.ok('finished');
  });

  // endAll:
  //  a) calls the end() on the parser, woo
  //  b) kills anything else in flight, catching our mistakes
  tap.endAll();

  let result = createEmptyTestResult();
  return result;
}

export = byRequire;
