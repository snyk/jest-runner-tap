import { Config } from '@jest/types';
import { TestResult } from '@jest/test-result';
import { JestEnvironment } from '@jest/environment';
import Runtime = require('jest-runtime');
import { makeParser, translateArray } from './translator';

async function byRequire(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const [parser, output] = makeParser();

  const tap = runtime.requireModule(require.resolve('tap'));
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

export = byRequire;
