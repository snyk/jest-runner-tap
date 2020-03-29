import type { SerializableError, TestResult } from '@jest/test-result';
import type { Result } from 'tap-parser';
import chalk = require('chalk');
import type { Context } from '../context';
import { renderDiag } from './diag';

const ANCESTRY_SEPARATOR = ' \u203A ';
const TITLE_BULLET = chalk.bold('\u25cf ');

export function pushTestResults(
  context: Context,
  result: TestResult,
  results: Result[],
  path: string[],
  time: number | undefined,
): void {
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
    const failureName = failure.diag?.test || failure.name;

    // copied from: https://github.com/facebook/jest/blob/d7a7b4294a4507030f86fe4f78e1790f53d0bda9/packages/jest-message-util/src/index.ts#L319
    msg +=
      chalk.bold.red(
        '  ' +
          TITLE_BULLET +
          path.join(ANCESTRY_SEPARATOR) +
          (path.length ? ANCESTRY_SEPARATOR : '') +
          failureName,
      ) + '\n\n';
    msg += renderDiag(context, failure).trimRight();
    msg += '\n';
    failureMessages.push(msg);
  }
  if (failureMessages.length) {
    result.failureMessage += failureMessages.join('\n').trimRight() + '\n\n';
  }
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
  context: Context,
  result: TestResult,
  err: SerializableError,
  msg: string,
): void {
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
): void {
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
  result.failureMessage += `\n    ... and ${chalk.red(
    `the test ${chalk.bold('file')} failed`,
  )} `;
  if (code) {
    result.failureMessage += `with an exit code, ${chalk.red(code)}`;
  }

  if (sig) {
    result.failureMessage += `with a signal, ${chalk.red(sig)}`;
  }

  result.failureMessage += '\n';
}
