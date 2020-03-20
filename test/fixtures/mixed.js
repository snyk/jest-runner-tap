const tap = require('tap');

tap.ok(true, 'startup');

tap.test('first', async (t) => {
  t.ok(true, 'before');

  await t.test('second', async (t) => {
    t.ok(true, 'inside');
  });

  t.ok(true, 'after');
});

tap.ok(true, 'shutdown');
