const { test } = require('tap');

test('outer', async (t) => {
  t.ok(false, 'before');
  for (let i = 0; i < 100; ++i) {
    t.ok(true, `yup ${i}`);
  }
  t.ok(false, 'after');
});
