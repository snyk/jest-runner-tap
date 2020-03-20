import { inspect } from 'util';
import type {
  SerializableError,
  TestResult,
} from '@jest/test-result';
import type { ExceptionDiag, Result, TimeoutDiag } from 'tap-parser';
import { formatStackTrace } from 'jest-message-util';
import { Context } from '../context';

export function pushTestResults(context: Context, result: TestResult, results: Result[], path: string[], time: number | undefined) {
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
    msg += `  ✕  ${failure.diag?.test || failure.name}\n\n`;
    msg += renderDiag(context, failure);
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

function renderDiag(context: Context, failure: Result) {
  if ('returnedPromiseRejection' === failure?.diag?.tapCaught) {
    return renderException(context, failure as Result<ExceptionDiag>);
  }

  if (failure?.diag?.signal) {
    return renderTimeout(context, failure as Result<TimeoutDiag>);
  }

  return inspect(failure, {depth: 3, colors: true}).replace(
    /^/gm,
    '     ',
  );
}

function renderException(context: Context, failure: Result<ExceptionDiag>) {
  // undo tap's pretty formatting, and let jest have at it instead
  const ruined = failure.diag.stack
    .trimRight()
    .replace(/\((?!\/)/g, `(${context.globalConfig.rootDir}/`)
    .replace(/^/mg, ' at ');

  const stackAndMaybeCode = formatStackTrace(ruined, context.projectConfig, context.globalConfig);
  return `    ${failure.diag.type}: ${failure.name}\n${stackAndMaybeCode}`;
}

function renderTimeout(context: Context, failure: Result<TimeoutDiag>) {
  return `    Timeout! ${failure.diag.signal} triggered by ${failure.diag.expired} during ${failure.diag.test}`;
}

export function pushExceptionFailure(
  context: Context,
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