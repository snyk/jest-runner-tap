const { test } = require('tap');
const sleep = require('sleep-promise');

test('alpha', async (t) => {
  await sleep(200);
  t.ok(true, 'first test');
});

test('bravo', async (t) => {
  t.ok(true, 'before');
  await sleep(1_000);
  t.ok(true, 'after');
});

test('charlie', async (t) => {
  t.ok(true, 'last test');
});
