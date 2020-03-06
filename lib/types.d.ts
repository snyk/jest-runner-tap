declare module 'tap-parser' {
  import { Writable } from 'stream';
  class TapParser extends Writable {}
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
