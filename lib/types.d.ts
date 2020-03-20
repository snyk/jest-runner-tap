declare module 'tap-parser' {
  import { Result } from 'tap-parser';

  interface TapParser extends NodeJS.WritableStream {}

  class TapParser {
    on(event: 'child', handler: (child: TapParser) => void): this;
    on(event: 'assert', handler: (result: Result) => void): this;
  }

  namespace TapParser {
    export interface TapLocation {
      line: number;
      column: number;
      file: string;
      function: string;
    }

    export interface ExceptionDiag {
      tapCaught: 'returnedPromiseRejection';

      test: string;
      source: string;

      at: TapLocation;
      type: string;
      stack: string;
    }

    export interface FallbackDiag {
      tapCaught: undefined;

      test?: string;
    }

    export type Diag = ExceptionDiag | FallbackDiag;

    export interface Result {
      ok: boolean;
      id: number;
      time?: number;
      name: string;
      diag?: Diag;
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
