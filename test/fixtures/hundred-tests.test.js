const { test } = require('tap');

test('outer', async (t) => {
  t.ok(false, 'before');
  for (let i = 0; i < 100; ++i) {
    t.test(`inner ${i}`, async (t) => {
      t.ok(true, `yup ${i}`);
    });
  }
  t.ok(false, 'after');
});
