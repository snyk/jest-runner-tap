import { spawn } from 'child_process';
import * as path from 'path';

import Runtime = require('jest-runtime');
import { Config } from '@jest/types';
import { JestEnvironment } from '@jest/environment';
import { TestResult } from '@jest/test-result';
import { replaceRootDirInPath } from 'jest-config';
import { makeParser, translateArray } from './translator';
import { Writable } from 'stream';

export async function bySpawn(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const tapCommand = (
    config.testEnvironmentOptions['tapCommand'] || [
      path.join(config.rootDir, 'node_modules/.bin/tap'),
      '-R',
      'tap',
    ]
  ).map((p: string) => replaceRootDirInPath(config.rootDir, p));

  const [parser, output] = makeParser();

  const [code, sig] = await runTapOn(parser, tapCommand, testPath);

  const result = translateArray(output);

  result.displayName = testPath;
  result.testFilePath = testPath;

  if (code || sig) {
    result.testResults.push({
      title: 'process success',
      fullName: `${testPath} exited successfully`,
      duration: null,
      numPassingAsserts: 0,
      ancestorTitles: [testPath],
      failureMessages: [`${code} - ${sig}`],
      location: undefined,
      status: 'failed',
    });
    result.numFailingTests += 1;
    result.failureMessage += `... and the test *file* failed: ${code} ${sig}`;
  }

  return result;
}

async function runTapOn(
  parser: Writable,
  tapCommand: string[],
  testPath: string,
): Promise<[number | null, string | null]> {
  const proc = spawn(tapCommand[0], [...tapCommand.slice(1), testPath], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  return await new Promise((resolve, reject) => {
    proc.stdout.pipe(parser);
    proc.on('error', reject);
    proc.on('exit', (code, signal) => resolve([code, signal]));
    proc.on('disconnect', reject);
  });
}
