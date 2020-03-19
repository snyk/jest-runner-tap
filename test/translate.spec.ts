import * as fs from 'fs-extra';
import type { AssertionResult } from '@jest/test-result';
import { makeParser, translateResult } from '../lib/translator';

describe('translation', () => {
  it('singular test', async () => {
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
});

async function testTranslation(tapFile: string) {
  const [parser, output] = makeParser();
  await new Promise(((resolve, reject) => {
    const fullPath = require.resolve(tapFile);
    const stream = fs.createReadStream(fullPath);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(parser);
  }));

  return translateResult(tapFile, output, [0, null]);
}
