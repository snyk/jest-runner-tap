import type {SerializableError, TestResult} from '@jest/test-result';
import type { Result } from 'tap-parser';
import type { BuildTree, ChildNode } from './builder';
import { pushExceptionFailure, pushTestResults } from '../translator/render';

export function flatten(result: TestResult, builder: BuildTree): void {
  const events = builder.ours;
  const first = events[0];
  if (first?.kind === 'child') {
    handle(result, first, []);
  }
  if (events.length > 1) {
    pushExceptionFailure(result, new Error('invalid root array length') as SerializableError, 'events.length');
  }
}

function handle(result: TestResult, node: ChildNode, path: string[]): void {
  const events = node.children;

  const asserts: Result[] = [];

  for (const event of events) {
    switch (event.kind) {
      case 'child':
        handle(result, event, [...path, event.result.name]);
        break;
      case 'assert':
        asserts.push(event.result);
        break;
      default:
        throw new TypeError(`invalid kind: ${(event as any).kind}`);
    }
  }

  if (0 !== asserts.length) {
    pushTestResults(result, asserts, path, node.result.time);
  }
}
