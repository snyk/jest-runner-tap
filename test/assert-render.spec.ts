import { TestResult } from '@jest/test-result';
import { testTranslation, findAssert } from './sniff';

describe('assert rendering', () => {
  let result: TestResult;
  beforeAll(async () => {
    result = await testTranslation('./fixtures/assertions.tap');
  });

  it('handles ok', async () => {
    expect(findAssert(result, 'is ok')).toMatchSnapshot();
  });

  it('handles notOk', async () => {
    expect(findAssert(result, 'is notOk')).toMatchSnapshot();
  });

  it('handles equal', async () => {
    expect(findAssert(result, 'is equal')).toMatchSnapshot();
  });

  it('handles same', async () => {
    expect(findAssert(result, 'is same')).toMatchSnapshot();
  });
});
