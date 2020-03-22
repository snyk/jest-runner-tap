import { TestResult } from '@jest/test-result';
import { testTranslation, findAssert } from './sniff';

describe('assert throws rendering', () => {
  let result: TestResult;
  beforeAll(async () => {
    result = await testTranslation('./fixtures/assertions.tap');
  });

  it('handles not error', async () => {
    expect(findAssert(result, 'is not error')).toMatchSnapshot();
  });

  it('handles thrown', async () => {
    expect(findAssert(result, 'is thrown')).toMatchSnapshot();
  });

  it('handles not thrown', async () => {
    expect(findAssert(result, 'is not thrown')).toMatchSnapshot();
  });

  it('handles rejected', async () => {
    expect(findAssert(result, 'is rejected')).toMatchSnapshot();
  });

  it('handles resolved', async () => {
    expect(findAssert(result, 'is resolved')).toMatchSnapshot();
  });
});
