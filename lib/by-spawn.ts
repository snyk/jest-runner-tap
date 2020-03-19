import { spawn } from 'child_process';
import { Config } from '@jest/types';
import { JestEnvironment } from '@jest/environment';
import Runtime from 'jest-runtime';
import { TestResult } from '@jest/test-result';
import { translateResult, makeParser } from './translator';
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

  const processResult = await runTapOn(parser, config.tapCommand, testPath);

  return translateResult(testPath, output, processResult);
}

async function runTapOn(
  parser: NodeJS.WritableStream,
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
