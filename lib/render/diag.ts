import cloneDeep = require('lodash.clonedeep');
import type { ExceptionDiag, Result } from 'tap-parser';
import { formatStackTrace } from 'jest-message-util';
import { printDiffOrStringify } from 'jest-matcher-utils';
import chalk = require('chalk');
import { Context } from '../context';
import * as yaml from 'yaml';

function renderLocation(diag: any, msg: string) {
  if ('found' in diag && 'wanted' in diag && 'compare' in diag) {
    const diff = printDiffOrStringify(diag.wanted, diag.found, '  found', ' wanted', true);
    msg += indent(`${diff}\ncompare: ${diag.compare}\n\n`);

    delete diag.found;
    delete diag.wanted;
    delete diag.compare;
  }
  return msg;
}

export function renderDiag(context: Context, origFailure: Result): string {
  const failure = cloneDeep(origFailure);

  let msg: string = '';

  if ('returnedPromiseRejection' === failure?.diag?.tapCaught) {
    msg += renderException(context, failure as Result<ExceptionDiag>);
    delete failure.diag.tapCaught;
  } else if (failure?.diag) {
    const diag: any = failure?.diag;
    msg = renderLocation(diag, msg);

    if ('diff' in diag) {
      msg += indent(highlightDiff(diag.diff), '         ');
      delete diag.diff;
    }

    if (diag.stack) {
      msg += indent('The failure occurred here:\n');
      msg += repairStackTrace(context, diag.stack);
      msg += '\n\n';
      maybeDeleteStackInfo(msg, diag);
    }

    if (diag.origin?.stack) {
      msg += indent('The error was:\n');
      msg += repairStackTrace(context, diag.origin.stack);
      maybeDeleteStackInfo(msg, diag.origin);

      if (isEmpty(diag.origin)) {
        delete diag.origin;
      }

      if (isEmpty(diag.found)) {
        delete diag.origin;
      }

      // no idea what this is (t.throws)
      if (isEmpty(diag.found)) {
        delete diag.found;
      }
    }
  }

  delete failure.id;
  delete failure.ok;

  if (msg) {
    delete failure.name;
    delete failure.fullname;
  }

  if (isEmpty(failure.diag)) {
    delete failure.diag;
  }

  if (msg) {
    return `${msg}\n\n${fallback(failure)}`;
  }

  return fallback(failure);
}

function fallback(failure: Partial<Result>): string {
  if (isEmpty(failure)) {
    return '';
  }
  let msg = `Additionally, ${chalk.grey('tap')} said:\n\n`;
  msg += yaml.stringify(failure);
  return indent(msg);
}

function repairStackTrace(context: Context, stack: string) {
  const ruined = stack
    .trimRight()
    .replace(/\((?!\/)/g, `(${context.globalConfig.rootDir}/`)
    .replace(/^/gm, ' at ');

  return formatStackTrace(
    ruined,
    context.projectConfig,
    context.globalConfig,
  );
}

function maybeDeleteStackInfo(rendered: string, diag: any) {
  delete diag.stack;
  // guessing if it has line-numbered sections; terrible
  if (-1 !== rendered.indexOf(' | ')) {
    delete diag.source;
    delete diag.at;
  }
}

// I can't believe there isn't a convenient version of this lying around
function highlightDiff(diff: string): string {
  let out = '';
  for (const line of diff.split('\n')) {
    out += diffColour(line[0])(line) + '\n';
  }
  return out;
}

function diffColour(char: string): (value: string) => string {
  switch (char) {
    case '+':
      return chalk.green;
    case '-':
      return chalk.red;
    case '@':
      return chalk.yellow;
    default:
      return (s: string) => s;
  }
}

function renderException(context: Context, failure: Result<ExceptionDiag>) {
  // undo tap's pretty formatting, and let jest have at it instead
  const stackAndMaybeCode = repairStackTrace(context, failure.diag.stack);

  const msg = `    ${failure.diag.type}: ${failure.name}\n${stackAndMaybeCode}`;

  delete failure.name;
  delete failure.fullname;
  delete failure.diag.type;
  delete failure.diag.test;

  maybeDeleteStackInfo(stackAndMaybeCode, failure.diag);

  return msg;
}

function indent(val: string, by = '    '): string {
  return val.replace(/^/gm, by);
}

function isEmpty(val: object | undefined): val is {} {
  return !val || 0 === Object.keys(val).length;
}
