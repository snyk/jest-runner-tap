import * as fs from 'fs-extra';
import TapParser = require('tap-parser');
import type { Result } from 'tap-parser';
import { inspect } from 'util';

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
  readonly ours: ResultyThing[] = [];
  private currentChild?: Grabber;

  constructor(parser: TapParser) {
    parser.on('child', (child) => {
      if (undefined !== this.currentChild) {
        throw new Error(
          'new child while we still had events: ' + inspect(this.ours),
        );
      }
      this.currentChild = new Grabber(child);
    });
    parser.on('assert', (result) => {
      if (undefined !== this.currentChild) {
        this.ours.push({
          kind: 'child',
          result,
          children: [...this.currentChild.ours],
        });
        this.currentChild = undefined;
      } else {
        this.ours.push({
          kind: 'assert',
          result,
        });
      }
    });
  }
}

describe('manual parser', () => {
  it('handles one', async () => {
    const parser = new TapParser();
    const grabber = new Grabber(parser);
    await feed('./fixtures/one.tap', parser);
    console.dir(inspect(grabber.ours, false, 8));
  });
  it('handles two', async () => {
    const parser = new TapParser();
    const grabber = new Grabber(parser);
    await feed('./fixtures/two.tap', parser);
    console.dir(inspect(grabber.ours, false, 8));
  });
});

async function feed(tapFile: string, parser: NodeJS.WritableStream): Promise<void> {
  return new Promise((resolve, reject) => {
    const fullPath = require.resolve(tapFile);
    const stream = fs.createReadStream(fullPath);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(parser);
  });
}
