import { createEmptyTestResult, TestResult } from '@jest/test-result';
import TapParser = require('tap-parser');
import { pushExceptionFailure, pushProcessFailure } from '../render';
import { flatten } from './flatten';
import { BuildTree } from './builder';
import { Context } from '../context';

// it is up to the caller to make sure the returned array is only read after the parser is complete
export function makeParser(
  extraSink: (text: string) => void,
): [TapParser, BuildTree] {
  const parser = new TapParser();

  const output = new BuildTree(parser, extraSink);

  return [parser, output];
}

export function translateResult(
  context: Context,
  builder: BuildTree,
  [code, sig]: [number | null, string | null],
): TestResult {
  const result = defaultTestResult(context.testPath);

  try {
    flatten(context, result, builder);
  } catch (err) {
    if (context.maskErrors) {
      pushExceptionFailure(context, result, err, 'pushAsserts');
    } else {
      throw err;
    }
  }

  if (code || sig) {
    pushProcessFailure(result, context.testPath, code, sig);
  }

  // empty string -> undefined
  if (!result.failureMessage?.trim()) {
    delete result.failureMessage;
  }

  return result;
}

function defaultTestResult(testPath: string): TestResult {
  const result = createEmptyTestResult();
  result.failureMessage = '';
  result.testFilePath = testPath;
  return result;
}
