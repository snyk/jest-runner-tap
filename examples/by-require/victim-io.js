const test = require('tap').test;

test('simple test', (t) => {
  t.equal(1, 1);
  t.end();
});

test('second test', (t) => {
  t.equal(2, 2);
  t.end();
});

require('fs').readFile('/dev/null', () => {
  test('file test', async (t) => {
    t.ok('read a file!');
  });
});
