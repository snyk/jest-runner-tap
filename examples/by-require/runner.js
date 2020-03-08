const Parser = require('tap-parser');
const eventsToArray = require('events-to-array');

async function main() {
  const tap = require('tap');
  let parser = new Parser();
  tap.pipe(parser);

  const events = eventsToArray(parser);

  require(process.argv[2] || './victim');

  await tap.test('jest-tap-bridge is finishing up', async (t) => {
    t.ok('finished');
  });

  // endAll:
  //  a) calls the end() on the parser, woo
  //  b) kills anything else in flight, catching our mistakes
  tap.endAll();

  const last = events[events.length - 1];

  if (!last) {
    throw new Error('no events');
  }

  if (4 !== last[1].pass && 8 !== last[1].pass) {
    console.dir(last[1]);
    throw new Error('incorrect last event');
  }
}

main()
  .then(() => console.log('done'))
  .catch((e) => console.error(e));
