const { test } = require('tap');

test('assertions', async (t) => {
  await t.test('equality', async (t) => {
    t.ok(false, 'is ok');
    t.notOk(true, 'is notOk');
    t.equal(false, true, 'is equal');
    t.same(false, true, 'is same');
  });

  await t.test('errors', async (t) => {
    t.error(new Error('with message'), 'is not error');

    t.throws(() => 'also good!', 'is thrown');
    t.doesNotThrow(() => {
      throw new Error('oops!');
    }, 'is not thrown');

    await t.resolves(async () => {
      throw new Error('bam!');
    }, 'is resolved');
    await t.rejects(async () => 'all good!', 'is rejected');
  });
});
