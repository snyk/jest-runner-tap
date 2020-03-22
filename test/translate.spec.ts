import type { AssertionResult } from '@jest/test-result';
import { testTranslation } from './sniff';

describe('translation', () => {
  it('handles a test with one assert', async () => {
    const result = await testTranslation('./fixtures/one.tap');
    expect(result.failureMessage).toBeUndefined();
    expect(result.numFailingTests).toBe(0);
    expect(result.numPendingTests).toBe(0);
    expect(result.numPassingTests).toBe(1);
    expect(result.skipped).toBe(false);
    expect(result.testResults).toStrictEqual([
      expect.objectContaining({
        title: 'hello',
        status: 'passed',
        numPassingAsserts: 1,
        failureMessages: [],
        ancestorTitles: [],
      } as Partial<AssertionResult>),
    ]);
    expect(result.testResults[0].duration).toBeGreaterThan(0);
  });

  it('handles two passing tests', async () => {
    const result = await testTranslation('./fixtures/two.tap');
    expect(result.failureMessage).toBeUndefined();
    expect(result.numFailingTests).toBe(0);
    expect(result.numPendingTests).toBe(0);
    expect(result.numPassingTests).toBe(2);
    expect(result.skipped).toBe(false);
    expect(result.testResults).toStrictEqual([
      expect.objectContaining({
        title: 'alpha',
        status: 'passed',
        numPassingAsserts: 2,
        failureMessages: [],
        ancestorTitles: [],
      } as Partial<AssertionResult>),
      expect.objectContaining({
        title: 'bravo',
        status: 'passed',
        numPassingAsserts: 2,
        failureMessages: [],
        ancestorTitles: [],
      } as Partial<AssertionResult>),
    ]);
    expect(result.testResults[0].duration).toBeGreaterThan(0);
  });

  it('handles mixing of asserts and tests', async () => {
    const result = await testTranslation('./fixtures/mixed.tap');
    expect(result.failureMessage).toBeUndefined();
    expect(result.numFailingTests).toBe(0);
    expect(result.numPendingTests).toBe(0);
    expect(result.numPassingTests).toBe(3);
    expect(result.skipped).toBe(false);
    expect(result.testResults).toStrictEqual([
      expect.objectContaining({
        title: 'second',
        status: 'passed',
        numPassingAsserts: 1,
        failureMessages: [],
        ancestorTitles: ['first'],
      } as Partial<AssertionResult>),
      expect.objectContaining({
        title: 'first',
        status: 'passed',
        numPassingAsserts: 2,
        failureMessages: [],
        ancestorTitles: [],
      } as Partial<AssertionResult>),
      expect.objectContaining({
        title: '⊥',
        status: 'passed',
        numPassingAsserts: 2,
        failureMessages: [],
        ancestorTitles: [],
      } as Partial<AssertionResult>),
    ]);
    expect(result.testResults[0].duration).toBeGreaterThan(0);
  });

  it('handles multiple levels of test nesting', async () => {
    const result = await testTranslation('./fixtures/deep.tap');
    expect(result.failureMessage).toBeUndefined();
    expect(result.numFailingTests).toBe(0);
    expect(result.numPendingTests).toBe(0);
    expect(result.numPassingTests).toBe(1);
    expect(result.skipped).toBe(false);
    expect(result.testResults).toStrictEqual([
      expect.objectContaining({
        title: 'fourth',
        status: 'passed',
        numPassingAsserts: 1,
        failureMessages: [],
        ancestorTitles: ['first', 'second', 'third'],
      } as Partial<AssertionResult>),
    ]);
    expect(result.testResults[0].duration).toBeGreaterThan(0);
  });
});
