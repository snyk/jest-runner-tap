import { Config } from '@jest/types';

export interface Context {
  testPath: string;
  globalConfig: Config.GlobalConfig;
  projectConfig: Config.ProjectConfig;
  maskErrors: boolean;
}
