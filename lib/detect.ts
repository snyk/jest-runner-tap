import { bySpawn } from './by-spawn';
import type { Config } from '@jest/types';
import type { JestEnvironment } from '@jest/environment';
import type Runtime from 'jest-runtime';
import type { TestResult } from '@jest/test-result';

export async function detect(
  globalConfig: Config.GlobalConfig,
  config: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  return bySpawn(globalConfig, config, environment, runtime, testPath);
}
