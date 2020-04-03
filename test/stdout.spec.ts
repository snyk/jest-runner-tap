import { testTranslation } from './sniff';

describe('maintenance of stdout', () => {
  it('handles a simple console.log', async () => {
    const extras: string[] = [];
    const result = await testTranslation('./fixtures/stdout.tap', (text) =>
      extras.push(text),
    );
    expect(result.numPassingTests).toBe(1);
    expect(result.failureMessage).toBeUndefined();
    // jest fills this after we are complete, so we can't populate it
    expect(result.console).toBeUndefined();
    expect(extras).toMatchSnapshot();
  });
});
