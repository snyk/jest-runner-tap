import * as fs from 'fs-extra';
import TapParser = require('tap-parser');
import { inspect } from 'util';
import { BuildTree } from '../lib/tree/builder';

describe('manual parser', () => {
  it('handles one', async () => {
    const parser = new TapParser();
    const builder = new BuildTree(parser);
    await feed('./fixtures/one.tap', parser);
    console.dir(inspect(builder.ours, false, 8));
  });
  it('handles two', async () => {
    const parser = new TapParser();
    const builder = new BuildTree(parser);
    await feed('./fixtures/two.tap', parser);
    console.dir(inspect(builder.ours, false, 8));
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
