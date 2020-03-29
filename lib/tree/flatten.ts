import type { SerializableError, TestResult } from '@jest/test-result';
import type { AssertNode, BuildTree, ChildNode, TreeNode } from './builder';
import { pushExceptionFailure, pushTestResults } from '../render';
import { Context } from '../context';

export function flatten(
  context: Context,
  result: TestResult,
  builder: BuildTree,
): void {
  const events = builder.finished();
  const first = events[0];
  if (first?.kind === 'child') {
    handle(context, result, first, []);
  }
  if (events.length > 1) {
    pushExceptionFailure(
      context,
      result,
      new Error('invalid root array length') as SerializableError,
      'events.length',
    );
  }
}

function handle(
  context: Context,
  result: TestResult,
  node: ChildNode,
  path: string[],
): void {
  const { child, assert } = byKind(node.children);

  for (const event of child) {
    handle(context, result, event, [...path, event.result.name]);
  }

  const asserts = assert.map((node) => node.result);

  if (0 === assert.length && 0 === child.length && 0 !== path.length) {
    asserts.push({
      ok: true,
      id: -1,
      name: 'faking success for an empty test',
      diag: undefined,
    });
  }

  if (0 !== asserts.length) {
    pushTestResults(context, result, asserts, path, node.result.time);
  }
}

interface ByKind {
  child: ChildNode[];
  assert: AssertNode[];
}

function byKind(events: TreeNode[]): ByKind {
  const ret: ByKind = { child: [], assert: [] };
  for (const event of events) {
    switch (event.kind) {
      case 'child':
        ret.child.push(event);
        break;
      case 'assert':
        ret.assert.push(event);
        break;
      default:
        throw new Error('unreachable');
    }
  }
  return ret;
}
