import { testTranslation } from './sniff';

describe('maintenance of stdout', () => {
  it('handles a simple console.log', async () => {
    const result = await testTranslation('./fixtures/stdout.tap');
    expect(result.numPassingTests).toBe(1);
    expect(result.failureMessage).toBeUndefined();
    expect(result.console).toMatchSnapshot();
  });
});
