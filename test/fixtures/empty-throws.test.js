const { test } = require('tap');

test('alpha', async () => {
});

test('bravo', async () => {
  throw new Error('oh no');
});
