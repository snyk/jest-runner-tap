declare module 'tap-parser' {
  import { Result } from 'tap-parser';

  interface TapParser extends NodeJS.WritableStream {}

  class TapParser {
    on(event: 'child', handler: (child: TapParser) => void): this;
    on(event: 'assert', handler: (result: Result) => void): this;
  }

  namespace TapParser {
    export interface Result {
      ok: boolean;
      id: number;
      time?: number;
      name: string;
      diag?: {
        test?: string;
      };
    }
  }

  export = TapParser;
}

declare module 'events-to-array' {
  import EventEmitter = NodeJS.EventEmitter;

  type Event = [string, any];

  function eventsToArray(
    emitter: EventEmitter,
    ignore?: string[],
    mapFunction?: (arg: unknown, index: number, list: unknown) => unknown,
  ): Event[];

  export = eventsToArray;
}
