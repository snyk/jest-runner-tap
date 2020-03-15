import * as fs from 'fs';
import { promisify } from 'util';
import { extract, parse } from 'jest-docblock'

const readFile = promisify(fs.readFile);

export type Pragmas = ReturnType<typeof parse>;

export async function fileConfig(testPath: string): Promise<Pragmas> {
  const buffer = await readFile(testPath);
  return parse(extract(buffer.toString()));
}
