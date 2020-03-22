import { inspect } from 'util';
import type { ExceptionDiag, Result, TimeoutDiag } from 'tap-parser';
import { formatStackTrace } from 'jest-message-util';
import { Context } from '../context';

export function renderDiag(context: Context, failure: Result): string {
  if ('returnedPromiseRejection' === failure?.diag?.tapCaught) {
    return renderException(context, failure as Result<ExceptionDiag>);
  }

  if (failure?.diag?.signal) {
    return renderTimeout(context, failure as Result<TimeoutDiag>);
  }

  return inspect(failure, { depth: 3, colors: true }).replace(/^/gm, '     ');
}

function renderException(context: Context, failure: Result<ExceptionDiag>) {
  // undo tap's pretty formatting, and let jest have at it instead
  const ruined = failure.diag.stack
    .trimRight()
    .replace(/\((?!\/)/g, `(${context.globalConfig.rootDir}/`)
    .replace(/^/gm, ' at ');

  const stackAndMaybeCode = formatStackTrace(
    ruined,
    context.projectConfig,
    context.globalConfig,
  );
  return `    ${failure.diag.type}: ${failure.name}\n${stackAndMaybeCode}`;
}

function renderTimeout(context: Context, failure: Result<TimeoutDiag>) {
  return `    Timeout! ${failure.diag.signal} triggered by ${failure.diag.expired} during ${failure.diag.test}`;
}
