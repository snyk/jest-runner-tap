declare module 'tap-parser' {
  import { Result } from 'tap-parser';

  interface TapParser extends NodeJS.WritableStream {}

  class TapParser {
    on(event: 'assert', handler: (result: Result) => void): this;
    on(event: 'child', handler: (child: TapParser) => void): this;
    on(event: 'comment', handler: (comment: string) => void): this;
    on(event: 'line', handler: (line: string) => void): this;
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
      signal: undefined;

      test: string;
      source: string;

      at: TapLocation;
      type: string;
      stack: string;
    }

    export interface TimeoutDiag {
      tapCaught: undefined;

      signal: NodeJS.Signals;
      expired: string;
      test: string;
    }

    export interface FallbackDiag {
      tapCaught: undefined;
      signal: undefined;

      test?: string;

      at?: TapLocation;
      stack?: string;
      source?: string;
    }

    export type Diag = ExceptionDiag | TimeoutDiag | FallbackDiag;

    export interface Result<D = Diag | undefined> {
      ok: boolean;
      id: number;
      time?: number;
      name: string;
      fullname?: string;
      diag: D;
    }
  }

  export = TapParser;
}
