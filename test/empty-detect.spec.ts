import { testTranslation } from './sniff';

describe('empty tests and empty test files are different', () => {
  it('produces no tests for empty files', async () => {
    const result = await testTranslation('./fixtures/empty.tap');
    expect(result.testResults).toHaveLength(0);
  });

  it('produces no tests for nearly empty files', async () => {
    const result = await testTranslation('./fixtures/empty.tap');
    expect(result.testResults).toHaveLength(0);
  });

  it('produces synthetic tests for empty "describe" blocks', async () => {
    const result = await testTranslation('./fixtures/empty-describe.tap');
    expect(result.testResults).toHaveLength(2);
  });

  it('produces real failures for real non-assertion failures', async () => {
    const result = await testTranslation('./fixtures/empty-throws.tap');
    expect(result.numFailingTests).toBe(1);
    expect(result.numPassingTests).toBe(1);
    expect(result.testResults).toHaveLength(2);
  });
});
