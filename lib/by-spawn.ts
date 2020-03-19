import { spawn } from 'child_process';
import type { Writable } from 'stream';
import type { Config } from '@jest/types';
import type { JestEnvironment } from '@jest/environment';
import type Runtime from 'jest-runtime';
import type { TestResult } from '@jest/test-result';
import { defaultTestResult, makeParser, translateArray } from './translator';
import { loadConfig } from './config';

export async function bySpawn(
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  let config = await loadConfig(projectConfig);

  const [parser, output] = makeParser();

  const [code, sig] = await runTapOn(parser, config.tapCommand, testPath);

  const result = defaultTestResult(testPath);

  // 1: the path of the file itself
  translateArray(result, output, { strip: 1 });

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
    result.failureMessage += `\n... and the test *file* failed: ${code} ${sig}`;
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
