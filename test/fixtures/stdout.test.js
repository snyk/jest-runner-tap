const { test } = require('tap');
test('hello', async (t) => {
  t.ok(true, 'before');
  console.log('hello there');
  t.ok(true, 'after');
});
