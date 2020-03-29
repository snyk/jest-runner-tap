import { testTranslation } from './sniff';

describe('renderer has reasonably consistent whitespace output', () => {
  it('handles many asserts in one test', async () => {
    const result = await testTranslation('./fixtures/hundred-asserts.tap');
    expect(result.failureMessage).toMatchSnapshot();
  });

  it('handles many tests in one describe', async () => {
    const result = await testTranslation('./fixtures/hundred-tests.tap');
    expect(result.failureMessage).toMatchSnapshot();
  });
});
