import * as fs from 'fs';
import * as path from 'path';
import cloneDeep = require('lodash.clonedeep');
import type { ExceptionDiag, Result } from 'tap-parser';
import { formatStackTrace } from 'jest-message-util';
import { printDiffOrStringify } from 'jest-matcher-utils';
import { codeFrameColumns } from '@babel/code-frame';
import chalk = require('chalk');
import { Context } from '../context';
import * as yaml from 'yaml';
import { inspect } from 'util';

export function renderDiag(context: Context, origFailure: Result): string {
  const failure = cloneDeep(origFailure);

  let msg = '';

  if ('returnedPromiseRejection' === failure?.diag?.tapCaught) {
    msg += renderException(context, failure as Result<ExceptionDiag>);
    delete failure.diag.tapCaught;
  } else if (failure?.diag) {
    const diag: any = failure?.diag;

    if ('found' in diag && 'wanted' in diag && 'compare' in diag) {
      const diff = printDiffOrStringify(
        diag.wanted,
        diag.found,
        ' wanted',
        '  found',
        true,
      );
      msg += indent(`${diff}\ncompare: ${diag.compare}\n\n`);

      delete diag.found;
      delete diag.wanted;
      delete diag.compare;

      delete failure.name;
      delete failure.fullname;
    }

    if ('diff' in diag) {
      msg += indent(highlightDiff(diag.diff), '         ');
      delete diag.diff;

      delete failure.name;
      delete failure.fullname;
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

    if (diag.at) {
      try {
        msg += indent(
          `Extra location information:\n\n${renderAtWithoutStack(
            context,
            diag,
          )}\n\n`,
        );
      } catch (e) {
        // just leave the `at` as is
      }
    }
  }

  delete failure.id;
  delete failure.ok;

  if (isEmpty(failure.diag)) {
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
  let msg = `Additionally, ${chalk.grey('tap')} said:\n\n`;
  try {
    msg += yaml.stringify(failure);
  } catch (err) {
    msg += inspect(failure, {
      depth: 4,
      colors: true,
    });

    msg += "\n...which isn't valid yaml: " + err;
  }
  return indent(msg);
}

function repairStackTrace(context: Context, stack: string): string {
  const ruined = stack
    .trimRight()
    .replace(/\((?!\/)/g, `(${context.globalConfig.rootDir}/`)
    .replace(/^/gm, ' at ');

  return formatStackTrace(ruined, context.projectConfig, context.globalConfig);
}

function renderAtWithoutStack(context: Context, diag: any): string {
  const file = path.join(context.globalConfig.rootDir, diag.at.file);

  const msg = codeFrameColumns(
    fs.readFileSync(file).toString('utf-8'),
    { start: diag.at },
    { highlightCode: true },
  );

  delete diag.at;
  delete diag.source;

  return msg;
}

function maybeDeleteStackInfo(rendered: string, diag: any): void {
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
      return (s: string): string => s;
  }
}

function renderException(
  context: Context,
  failure: Result<ExceptionDiag>,
): string {
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
  return val.replace(/^(?!\s*$)/gm, by);
}

function isEmpty(val: any): val is undefined {
  return !val || 0 === Object.keys(val).length;
}
