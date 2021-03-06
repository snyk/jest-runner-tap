import type { Config } from '@jest/types';
import * as path from 'path';
import { replaceRootDirInPath } from 'jest-config';

export interface TapBridgeConfig {
  tapCommand: string[];
}

export async function loadConfig(
  project: Config.ProjectConfig,
): Promise<TapBridgeConfig> {
  const configBlock = project.globals['jest-runner-tap'] || {};
  const proj = configBlock as Record<string, unknown>;

  // take the defaults
  const config: TapBridgeConfig = {
    tapCommand: [
      path.join(project.rootDir, 'node_modules/.bin/tap'),
      '-R',
      'tap',
    ],
  };

  if (proj.tapCommand) {
    if (!Array.isArray(proj.tapCommand)) {
      throw new Error(
        'tap command must be an array, not ' + JSON.stringify(proj.tapCommand),
      );
    }
    config.tapCommand = replaceRootDirInParts(project.rootDir, proj.tapCommand);
  }

  return config;
}

function replaceRootDirInParts(rootDir: string, parts: string[]): string[] {
  return parts.map((p: string) => replaceRootDirInPath(rootDir, p));
}
