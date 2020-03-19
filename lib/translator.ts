import { inspect } from 'util';
import {
  createEmptyTestResult,
  SerializableError,
  TestResult,
} from '@jest/test-result';
import TapParser = require('tap-parser');
import eventsToArray = require('events-to-array');

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

type TestAssertions = { results: Result[]; time: number };
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

function pushAsserts(
  tests: Map<string[], TestAssertions>,
  strip: number,
  result: TestResult,
) {
  const tapSummary = [...tests.entries()].filter(
    ([path]) => path.length > strip,
  );

  for (const [fullPath, { results, time }] of tapSummary) {
    // removing the full path
    const path = fullPath.slice(strip);
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
    result.failureMessage += failureMessages.join('\n') + '\n';
    result.testResults.push({
      title: path[path.length - 1],
      fullName: path.join(' // '),
      duration: time,
      numPassingAsserts: passing.length,
      ancestorTitles: path.slice(1),
      failureMessages,
      location: undefined,
      status: passed ? 'passed' : 'failed',
    });
  }
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

function pushExceptionFailure(
  result: TestResult,
  err: SerializableError,
  msg: string,
) {
  result.testResults.push({
    title: `${msg} success`,
    fullName: `could ${msg} successfully`,
    duration: null,
    numPassingAsserts: 0,
    ancestorTitles: [],
    failureMessages: [`${err} - ${err.stack}`],
    location: undefined,
    status: 'failed',
  });
  result.failureMessage += `  ✕ ${msg} failed: ${err} - ${err.stack}\n\n`;
  result.numFailingTests += 1;
  if (!result.testExecError) {
    result.testExecError = err;
  }
}

function pushProcessFailure(
  result: TestResult,
  testPath: string,
  code: number | null,
  sig: string | null,
) {
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

function defaultTestResult(testPath: string): TestResult {
  const result = createEmptyTestResult();
  result.failureMessage = '';
  result.displayName = testPath;
  result.testFilePath = testPath;
  return result;
}
