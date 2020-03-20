const { test } = require('tap');
test('first', async (t) => {
  await t.test('second', async (t) => {
    await t.test('third', async (t) => {
      await t.test('fourth', async (t) => {
        t.ok(true, 'inside');
      });
    });
  });
});
