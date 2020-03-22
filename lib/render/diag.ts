import cloneDeep = require('lodash.clonedeep');
import type { ExceptionDiag, Result } from 'tap-parser';
import { formatStackTrace } from 'jest-message-util';
import { Context } from '../context';
import * as yaml from 'yaml';

export function renderDiag(context: Context, origFailure: Result): string {
  const failure = cloneDeep(origFailure);

  let msg: string = '';

  if ('returnedPromiseRejection' === failure?.diag?.tapCaught) {
    msg += renderException(context, failure as Result<ExceptionDiag>);
    delete failure.diag.tapCaught;
  }

  delete failure.id;
  delete failure.ok;

  if (!failure.diag || 0 === Object.entries(failure.diag).length) {
    delete failure.diag;
  }

  if (msg) {
    return `${msg}\n${fallback(failure)}`;
  }

  return fallback(failure);
}

function fallback(failure: Partial<Result>): string {
  if (isEmpty(failure)) {
    return '';
  }
  let msg = 'We failed to fully process the tap output:\n';
  msg += yaml.stringify(failure);
  return indent(msg);
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

  const msg = `    ${failure.diag.type}: ${failure.name}\n${stackAndMaybeCode}`;

  delete failure.name;
  delete failure.fullname;
  delete failure.diag.stack;
  delete failure.diag.type;
  delete failure.diag.test;

  // guessing if it has line-numbered sections; terrible
  if (-1 !== stackAndMaybeCode.indexOf(' | ')) {
    delete failure.diag.source;
    delete failure.diag.at;
  }

  return msg;
}

function indent(val: string): string {
  return val.replace(/^/gm, '    ');
}

function isEmpty(val: object): val is {} {
  return 0 === Object.keys(val).length;
}
