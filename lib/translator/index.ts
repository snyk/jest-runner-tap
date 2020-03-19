import { createEmptyTestResult, TestResult } from '@jest/test-result';
import TapParser = require('tap-parser');
import eventsToArray = require('events-to-array');
import {
  pushAsserts,
  pushExceptionFailure,
  pushProcessFailure,
} from './render';
import type { Result } from 'tap-parser';

type TapParserArray = Array<PChild | PAssert>;
type PChild = ['child', TapParserArray];
type PAssert = ['assert', Result];

export type TestAssertions = { results: Result[]; time: number };
type Tests = Map<string[], TestAssertions>;

// it is up to the caller to make sure the returned array is only read after the parser is complete
export function makeParser(): [TapParser, TapParserArray] {
  const parser = new TapParser();
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

  const output = eventsToArray(parser, ignore) as TapParserArray;

  return [parser, output];
}

export function translateResult(
  testPath: string,
  output: Array<PChild | PAssert>,
  [code, sig]: [number | null, string | null],
) {
  const result = defaultTestResult(testPath);

  const tests: Tests = new Map();

  try {
    bunchUp(output, tests);
  } catch (err) {
    pushExceptionFailure(result, err, 'bunchUp');
  }

  try {
    // 1: the path of the file itself
    pushAsserts(tests, 1, result);
  } catch (err) {
    pushExceptionFailure(result, err, 'pushAsserts');
  }

  if (code || sig) {
    pushProcessFailure(result, testPath, code, sig);
  }

  // empty string -> undefined
  if (!result.failureMessage?.trim()) {
    delete result.failureMessage;
  }

  return result;
}

function bunchUp(arr: TapParserArray, tests: Tests, path: string[] = []) {
  for (let i = 0; i < arr.length; ++i) {
    const el = arr[i];
    switch (el[0]) {
      case 'child': {
        i += 1;
        const follower = arr[i];
        if (2 !== follower?.length) {
          throw new Error(
            `unexpected child follower value: ${JSON.stringify(follower)}`,
          );
        }
        const [assert, result] = follower as [string, Result];
        if ('assert' !== assert) {
          throw new Error(
            `unexpected child follower type: ${JSON.stringify(follower)}`,
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

function defaultTestResult(testPath: string): TestResult {
  const result = createEmptyTestResult();
  result.failureMessage = '';
  result.displayName = testPath;
  result.testFilePath = testPath;
  return result;
}
