import { inspect } from 'util';
import type {
  SerializableError,
  TestResult,
} from '@jest/test-result';
import type { Result } from 'tap-parser';
import type { TestAssertions } from './index';

export function pushAsserts(
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
    pushTestResults(result, results, path, time);
  }
}


export function pushTestResults(result: TestResult, results: Result[], path: string[], time: number | undefined) {
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
    msg += inspect({...failure.diag}, {depth: 3, colors: true}).replace(
      /^/gm,
      '     ',
    );
    failureMessages.push(msg);
  }
  result.failureMessage += failureMessages.join('\n') + '\n';
  const root = 0 === path.length;
  result.testResults.push({
    title: root ? '⊥' : path[path.length - 1],
    fullName: root ? 'assertions at the top level' : path.join(' // '),
    duration: time,
    numPassingAsserts: passing.length,
    ancestorTitles: path.slice(0, path.length - 1),
    failureMessages,
    location: undefined,
    status: passed ? 'passed' : 'failed',
  });
}

export function pushExceptionFailure(
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

export function pushProcessFailure(
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
