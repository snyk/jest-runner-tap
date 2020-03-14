import { test } from 'tap';

test('simple test', (t) => {
  t.equal(1, 1);
  t.end();
});

test('second test', (t) => {
  t.equal(2, 2);
  t.end();
});

test('async test', async (t) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  t.ok('timeout done');
});

test('instant async test', async (t) => {
  t.ok('timeout done');
});

test('planned test', (t) => {
  t.plan(2);
  setTimeout(() => t.ok('in timeout'), 50);
  t.ok('actually run first');
});

test('nested test', async (t) => {
  t.test('alpha', async (t) => {
    t.equal(3, 3);
  });
  t.test('bravo', async (t) => {
    setTimeout(() => t.end(), 50);
  });
});

test('delayed test', async (t) => {
  await new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
  t.test('after delay', async (t) => {
    t.ok('after');
  });
});
