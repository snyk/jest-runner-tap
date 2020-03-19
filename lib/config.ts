import type { Config } from '@jest/types';
import * as path from "path";
import { replaceRootDirInPath } from 'jest-config';

export interface TapBridgeConfig {
  tapCommand: string[],
}

export async function loadConfig(project: Config.ProjectConfig): Promise<TapBridgeConfig> {
  const proj: Record<string, any> = project.globals['tap-bridge-config'] || {};

  // take the defaults
  const config: TapBridgeConfig = {
    tapCommand: [ path.join(project.rootDir, 'node_modules/.bin/tap'), '-R', 'tap' ],
  };

  if (proj.tapCommand) {
    config.tapCommand = replaceRootDirInParts(project.rootDir, proj.tapCommand);
  }

  return config;
}

function replaceRootDirInParts(rootDir: string, parts: string[]): string[] {
  return parts.map((p: string) => replaceRootDirInPath(rootDir, p))
}
