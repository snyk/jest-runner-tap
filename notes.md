### by-require

```typescript
import * as path from 'path';
import { Config, Global } from '@jest/types';
import { AssertionResult, TestResult } from '@jest/test-result';
import { JestEnvironment } from '@jest/environment';
import { SnapshotStateType } from 'jest-snapshot';
import Runtime = require('jest-runtime');
import {
  AssertionResult,
  TestResult,
  createEmptyTestResult,
} from '@jest/test-result';
import Parser = require('tap-parser');
import { Writable } from 'stream';

export async function byRequire(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const result = createEmptyTestResult();
  // const tap = runtime.requireModule(require.resolve('tap'));

  const tap = require('tap');
  // tap.jobs = 0;
  // tap.pipe(new Writable({
  //   write(chunk: any, encoding: string, callback: (error?: (Error | null)) => void): void {
  //     console.log(chunk.toString());
  //     callback();
  //   }
  // }));
  // const parsing = new Promise(resolve => {
  // const p = new Parser(resolve);
  // tap.pipe({
  //   write: (buffer) => {
  //     console.log('write', buffer.toString());
  //     return true;
  //   },
  //   on: (...args) => console.log('on', args),
  //   end: (...args) => {
  //     console.log('end', ...args);
  //     resolve();
  //   },
  // });
  // tap.pipe(p);
  // p.on('complete', resolve);
  // });
  tap.test('before', () => console.log('first'));
  // runtime.requireModule(testPath);
  tap.test('after', () => console.log('second'));
  tap.end();
  console.log('complete');
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return result;
}

```
