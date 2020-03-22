import * as fs from 'fs-extra';
import * as path from 'path';
import type { TestResult } from '@jest/test-result';
import { makeParser, translateResult } from '../lib/tree';

export async function testTranslation(tapFile: string): Promise<TestResult> {
  const [parser, output] = makeParser();
  await new Promise((resolve, reject) => {
    const fullPath = require.resolve(tapFile);
    const stream = fs.createReadStream(fullPath);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(parser);
  });

  const rootDir = path.join(__dirname, 'fixtures');
  return translateResult(
    {
      testPath: tapFile.replace('.tap', '.js'),
      globalConfig: {
        rootDir,
      } as any,
      projectConfig: {
        rootDir,
      } as any,
      maskErrors: false,
    },
    output,
    [0, null],
  );
}

export function findAssert(result: TestResult, name: string) {
  for (const test of result.testResults) {
    for (const message of test.failureMessages) {
      if (message.split('\n')[0].trim().includes(name)) {
        return message;
      }
    }
  }
  throw new Error('no test result found');
}
