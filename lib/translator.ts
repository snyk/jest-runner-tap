import { createEmptyTestResult, TestResult } from '@jest/test-result';
import { inspect } from 'util';
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

type Tests = Map<string[], { results: Result[]; time: number }>;

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

/**
 * @param strip remove leading path components; and ignore tests for fewer components
 */
export function translateArray(
  output: TapParserArray,
  { strip }: { strip: number },
): TestResult {
  const tests: Tests = new Map();
  bunchUp(output, tests);

  const tapSummary = [...tests.entries()].filter(
    ([path]) => path.length > strip,
  );
  const result = createEmptyTestResult();

  result.failureMessage = '';

  result.testResults = tapSummary.map(([fullPath, { results, time }]) => {
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

  return result;
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
