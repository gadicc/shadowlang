// import db from "gongo-client";
import type {
  JMdictWord,
  Kanjidic2Character,
} from "@scriptin/jmdict-simplified-types";

const jmdict = {
  async findById(id: string): Promise<JMdictWord | null> {
    return await fetch("/api/dicts/jmdict/id/" + id).then((res) => res.json());
  },
  async findByKana(kana: string): Promise<JMdictWord[]> {
    return await fetch("/api/dicts/jmdict/kana/" + kana).then((res) =>
      res.json(),
    );
  },
  async findByKanji(kanji: string): Promise<JMdictWord[]> {
    return await fetch("/api/dicts/jmdict/kanji/" + kanji).then((res) =>
      res.json(),
    );
  },
};

const kanjidic = {
  async findByLiteral(literal: string): Promise<Kanjidic2Character[]> {
    return await fetch("/api/dicts/kanjidic/literal/" + literal).then((res) =>
      res.json(),
    );
  },
};

if (typeof window !== "undefined") {
  // @ts-expect-error: add to window
  window.jmdict = jmdict;
  // @ts-expect-error: add to window
  window.kanjidic = kanjidic;
}

export { jmdict, kanjidic };
