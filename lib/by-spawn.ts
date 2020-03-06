import { spawn } from 'child_process';
import * as path from 'path';
import { inspect } from 'util';

import eventsToArray = require('events-to-array');
import Parser = require('tap-parser');
import Runtime = require('jest-runtime');
import { Config } from '@jest/types';
import { JestEnvironment } from '@jest/environment';
import { TestResult, createEmptyTestResult } from '@jest/test-result';
import { replaceRootDirInPath } from 'jest-config';

interface Result {
  ok: boolean;
  id: number;
  time?: number;
  name: string;
  diag?: {
    test?: string;
  };
}

type TapParserArray = Array<PChild | PAssert>;
type PChild = ['child', TapParserArray];
type PAssert = ['assert', Result];

type Tests = Map<string[], { results: Result[]; time: number }>;

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

  const [code, sig, output] = await runTapOn(tapCommand, testPath);

  const tests: Tests = new Map();
  bunchUp(output, tests);

  const tapSummary = [...tests.entries()].filter(([path]) => path.length > 1);
  const result = createEmptyTestResult();
  result.displayName = testPath;

  result.failureMessage = '';

  result.testResults = tapSummary.map(([fullPath, { results, time }]) => {
    // removing the full path
    const path = fullPath.slice(1);
    const passing = results.filter((r) => r.ok);
    const notOkay = results.filter((r) => !r.ok);
    const passed = notOkay.length === 0;
    if (passed) {
      result.numPassingTests += 1;
    } else {
      result.numFailingTests += 1;
    }
    const failureMessages: string[] = [];
    for (const failure of notOkay) {
      let msg = '';
      msg += `  ✕  ${failure.diag?.test || failure.name}\n`;
      msg += inspect({ ...failure.diag }, { depth: 3, colors: true }).replace(
        /^/gm,
        '     ',
      );
      failureMessages.push(msg);
    }
    result.failureMessage += failureMessages.join('\n');
    return {
      title: path[path.length - 1],
      fullName: path.join(' // '),
      duration: time,
      numPassingAsserts: passing.length,
      ancestorTitles: path.slice(1),
      failureMessages,
      location: undefined,
      status: passed ? 'passed' : 'failed',
    };
  });

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
  tapCommand: string[],
  testPath: string,
): Promise<[number | null, string | null, TapParserArray]> {
  const proc = spawn(tapCommand[0], [...tapCommand.slice(1), testPath], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });

  return await new Promise((resolve, reject) => {
    const p = new Parser();
    proc.stdout.pipe(p);
    const ignore = [
      'pipe',
      'unpipe',
      'prefinish',
      'finish',
      'line',
      'pass',
      'fail',
      'todo',
      'skip',
      'result',
      'version',
      'plan',
      'comment',
      'complete',

      // console output(?):
      'extra',
    ];
    const events = eventsToArray(p, ignore);
    proc.on('error', reject);
    proc.on('exit', (code, signal) =>
      resolve([code, signal, events as TapParserArray]),
    );
    proc.on('disconnect', reject);
  });
}

function bunchUp(arr: TapParserArray, tests: Tests, path: string[] = []) {
  for (let i = 0; i < arr.length; ++i) {
    const el = arr[i];
    switch (el[0]) {
      case 'child': {
        i += 1;
        const [assert, result] = arr[i] as [string, Result];
        if ('assert' !== assert) {
          throw new Error(
            `unexpected child follower: ${JSON.stringify(arr[i])}`,
          );
        }
        const newPath = [...path, result.name];
        tests.set(newPath, {
          results: [],
          time: result.time || 0,
        });
        bunchUp(el[1], tests, newPath);
        break;
      }

      case 'assert': {
        let state = tests.get(path);
        if (!state) {
          throw new Error(
            'assert for a test that does not exist: ' + JSON.stringify(path),
          );
        }
        state.results.push(el[1]);
        break;
      }
    }
  }
}
