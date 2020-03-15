import type { Config } from '@jest/types';
import * as path from "path";
import { replaceRootDirInPath } from 'jest-config';
import { fileConfig } from './file-config';

export type Runner = 'spawn' | 'require';

export interface TapBridgeConfig {
  runner: 'require' | 'spawn',
  tapCommand: string[],
}

export async function loadConfig(project: Config.ProjectConfig, testPath: string): Promise<TapBridgeConfig> {
  const proj: Record<string, any> = project.globals['tap-bridge-config'] || {};
  const test = await fileConfig(testPath);

  // take the defaults
  const config: TapBridgeConfig = {
    runner: 'spawn',
    tapCommand: [ path.join(project.rootDir, 'node_modules/.bin/tap'), '-R', 'tap' ],
  };


  // apply the project-global config, then the test-specific config (from the docblock)
  if (proj.runner) {
    config.runner = toRunner(proj.runner);
  }

  if (test.runner) {
    config.runner = toRunner(test.runner);
  }


  if (proj.tapCommand) {
    config.tapCommand = replaceRootDirInParts(project.rootDir, proj.tapCommand);
  }

  if (test.tapCommand) {
    throw new Error('overriding command per-test is not supported, due to author laziness');
  }

  return config;
}

function replaceRootDirInParts(rootDir: string, parts: string[]): string[] {
  return parts.map((p: string) => replaceRootDirInPath(rootDir, p))
}

function toRunner(runner: any): Runner {
  switch (runner) {
    case 'require':
      return 'require';
    case 'spawn':
      return 'spawn';
    default:
      throw new Error(`unrecognised runner: ${runner}`);
  }
}
