import { testTranslation } from './sniff';

describe('error rendering', () => {
  it('handles exceptions', async () => {
    const result = await testTranslation('./fixtures/type-error.tap');
    expect(result.numFailingTests).toBe(1);
    expect(result.numPassingTests).toBe(1);
    expect(result.failureMessage).toMatchSnapshot();
  });
});
