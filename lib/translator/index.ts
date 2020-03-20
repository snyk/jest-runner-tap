import { createEmptyTestResult, TestResult } from '@jest/test-result';
import TapParser = require('tap-parser');
import {
  pushExceptionFailure,
  pushProcessFailure,
} from './render';
import type { Result } from 'tap-parser';
import { flatten } from '../tree/flatten';
import { BuildTree } from '../tree/builder';

type TapParserArray = Array<PChild | PAssert>;
type PChild = ['child', TapParserArray];
type PAssert = ['assert', Result];

export type TestAssertions = { results: Result[]; time: number };

// it is up to the caller to make sure the returned array is only read after the parser is complete
export function makeParser(): [TapParser, BuildTree] {
  const parser = new TapParser();

  const output = new BuildTree(parser);

  return [parser, output];
}

export function translateResult(
  testPath: string,
  builder: BuildTree,
  [code, sig]: [number | null, string | null],
) {
  const result = defaultTestResult(testPath);

  try {
    flatten(result, builder);
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

function defaultTestResult(testPath: string): TestResult {
  const result = createEmptyTestResult();
  result.failureMessage = '';
  result.displayName = testPath;
  result.testFilePath = testPath;
  return result;
}
