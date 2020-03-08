interface Result {
  ok: boolean;
  id: number;
  time?: number;
  name: string;
  diag?: {
    test?: string;
  };
}

type TapParserArray = Array<PChild | PAssert>;
type PChild = ['child', TapParserArray];
type PAssert = ['assert', Result];
