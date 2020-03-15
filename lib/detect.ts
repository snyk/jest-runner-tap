import type { Config } from '@jest/types';
import type { JestEnvironment } from '@jest/environment';
import type Runtime from 'jest-runtime';
import type { TestResult } from '@jest/test-result';
import { bySpawn } from './by-spawn';
import { byRequire } from './by-require';
import { loadConfig } from './config';

export async function detect(
  globalConfig: Config.GlobalConfig,
  projectConfig: Config.ProjectConfig,
  environment: JestEnvironment,
  runtime: Runtime,
  testPath: string,
): Promise<TestResult> {
  const config = await loadConfig(projectConfig, testPath);
  switch (config.runner) {
    case 'spawn':
      return bySpawn(config, testPath);
    case 'require':
      return byRequire(runtime, testPath);
    default:
      throw new Error('unreachable');
  }
}
