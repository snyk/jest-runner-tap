import { spawn } from 'child_process';
import type { Writable } from 'stream';
import type { TestResult } from '@jest/test-result';
import type { TapBridgeConfig } from './config';
import { makeParser, translateArray } from './translator';

export async function bySpawn(
  config: TapBridgeConfig,
  testPath: string,
): Promise<TestResult> {
  const tapCommand = config.tapCommand;

  const [parser, output] = makeParser();

  const [code, sig] = await runTapOn(parser, tapCommand, testPath);

  // 1: the path of the file itself
  const result = translateArray(output, { strip: 1 });

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
