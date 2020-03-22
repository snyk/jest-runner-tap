import TapParser = require('tap-parser');
import type { Result } from 'tap-parser';
import { inspect } from 'util';

export interface ChildNode {
  kind: 'child';
  result: Result;
  children: TreeNode[];
}

export interface AssertNode {
  kind: 'assert';
  result: Result;
}

export type TreeNode = ChildNode | AssertNode;

export class BuildTree {
  private readonly ours: TreeNode[] = [];
  private currentChild?: BuildTree;

  private readonly guessedName?: string;
  private nextSubTestName?: string;

  constructor(parser: TapParser, guessedName?: string) {
    this.guessedName = guessedName;

    parser.on('line', (line) => {
      line = line.trim();
      // 'comment' events are mangled for subtests; return the file name?
      const prefix = '# Subtest: ';
      if (line.startsWith(prefix)) {
        this.nextSubTestName = line.slice(prefix.length).trim();
      }
    });

    parser.on('child', (child) => {
      if (undefined !== this.currentChild) {
        throw new Error(
          `new child while we still had events: ${inspect(this.ours)}`,
        );
      }
      this.currentChild = new BuildTree(child, this.nextSubTestName);
    });

    parser.on('assert', (result) => {
      if (undefined !== this.currentChild) {
        this.ours.push({
          kind: 'child',
          result,
          children: [...this.currentChild.finished()],
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

  finished(): TreeNode[] {
    if (this.currentChild) {
      this.ours.push({
        kind: 'child',
        result: {
          id: -1,
          ok: false,
          // who knows; the child's name is better (populated) for timeout
          name: `${this.currentChild.guessedName} (synthetic; test exploded)`,
        },
        children: [...this.currentChild.finished()],
      });
    }
    return this.ours;
  }
}
