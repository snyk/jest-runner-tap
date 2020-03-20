import type { AssertionResult } from '@jest/test-result';
import { testTranslation } from './translate.spec';

describe('translation of terminations', () => {
  it('handles a test which timed out', async () => {
    const result = await testTranslation('./fixtures/timeout.tap');
    expect(result.numFailingTests).toBe(1);
    expect(result.numPendingTests).toBe(0);
    expect(result.numPassingTests).toBe(1);
    expect(result.skipped).toBe(false);
    expect(result.failureMessage).toMatchSnapshot();
    expect(result.testResults).toStrictEqual([
      expect.objectContaining({
        title: 'alpha',
        status: 'passed',
        numPassingAsserts: 1,
        failureMessages: [],
        ancestorTitles: [],
      } as Partial<AssertionResult>),
    ]);
    expect(result.testResults[0].duration).toBeGreaterThan(0);
  });
});
