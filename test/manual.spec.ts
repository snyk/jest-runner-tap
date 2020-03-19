import * as fs from 'fs-extra';
import { Writable } from 'stream';
import TapParser = require('tap-parser');
import { inspect } from 'util';
import { Result } from '../lib/translator';

interface ChildResult {
  kind: 'child';
  result: Result;
  children: ResultyThing[];
}

interface AssertResult {
  kind: 'assert';
  result: Result;
}

type ResultyThing = ChildResult | AssertResult;

class Grabber {
  ours?: ResultyThing[];
  constructor(parent: ResultyThing[], parser: TapParser) {
    parser.on('child', (child) => {
      if (undefined !== this.ours) {
        throw new Error(
          'new child while we still had events: ' + inspect(this.ours),
        );
      }
      this.ours = [];
      new Grabber(this.ours, child);
    });
    parser.on('assert', (result) => {
      if (undefined !== this.ours) {
        parent.push({
          kind: 'child',
          result,
          children: [...this.ours],
        });
      } else {
        parent.push({
          kind: 'assert',
          result,
        });
      }
      this.ours = undefined;
    });
  }
}

describe('manual parser', () => {
  it('nests', async () => {
    const parser = new TapParser();
    const buffer: ResultyThing[] = [];
    new Grabber(buffer, parser);
    // parser.on('child', (child) => console.log(typeof child));
    // parser.on('assert', (ass) => console.log(typeof ass));
    await feed('./fixtures/one.tap', parser);
    console.dir(inspect(buffer, false, 8));
  });
});

async function feed(tapFile: string, parser: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullPath = require.resolve(tapFile);
    const stream = fs.createReadStream(fullPath);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(parser);
  });
}
