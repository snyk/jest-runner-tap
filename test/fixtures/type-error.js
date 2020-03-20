const { test } = require('tap');

test('gonna throw', async (t) => {
  t.ok(true, 'before');
  buggy(5);
  t.ok(true, 'after');
});

test('not gonna throw', async (t) => {
  t.ok(true, 'inside');
});

function buggy(value) {
  value();
}
