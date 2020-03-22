import { testTranslation } from './translate.spec';
import { TestResult } from '@jest/test-result';

describe('assert rendering', () => {
  let result: TestResult;
  beforeAll(async () => {
    result = await testTranslation('./fixtures/assertions.tap');
  });

  function findAssert(name: string) {
    for (const test of result.testResults) {
      for (const message of test.failureMessages) {
        if (message.split('\n')[0].trim().endsWith(name)) {
          return message;
        }
      }
    }
    throw new Error('no test result found');
  }

  it('handles ok', async () => {
    expect(findAssert('is ok')).toMatchSnapshot();
  });

  it('handles notOk', async () => {
    expect(findAssert('is notOk')).toMatchSnapshot();
  });

  it('handles equal', async () => {
    expect(findAssert('is equal')).toMatchSnapshot();
  });

  it('handles same', async () => {
    expect(findAssert('is same')).toMatchSnapshot();
  });
});
