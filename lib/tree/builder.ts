import TapParser = require('tap-parser');
import type { Result } from 'tap-parser';
import {inspect} from "util";

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
  readonly ours: TreeNode[] = [];
  private currentChild?: BuildTree;

  constructor(parser: TapParser) {
    parser.on('child', (child) => {
      if (undefined !== this.currentChild) {
        throw new Error(
          `new child while we still had events: ${inspect(this.ours)}`,
        );
      }
      this.currentChild = new BuildTree(child);
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

  collapse(path: string[], results: TreeNode[]): void {
    if (this.ours) {
      results.push(...this.ours);
    }

    if (this.currentChild) {
      this.currentChild.collapse([...path, 'unknown'], results);
    }
  }
}
