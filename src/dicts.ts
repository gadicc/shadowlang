// import db from "gongo-client";
import type {
  JMdictWord,
  JMdictDictionaryMetadata,
  Kanjidic2Character,
} from "@scriptin/jmdict-simplified-types";

let jmdictMetaCache: JMdictDictionaryMetadata | null = null;
const jmdict = {
  async getMetadata(): Promise<JMdictDictionaryMetadata> {
    if (!jmdictMetaCache)
      jmdictMetaCache = (await fetch("/api/dicts/jmdict/meta/meta").then(
        (res) => res.json(),
      )) as JMdictDictionaryMetadata;
    return jmdictMetaCache;
  },
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
  async findByKanjiAndKana(
    kanji?: string,
    kana?: string,
  ): Promise<JMdictWord[]> {
    if (!kanji && !kana) return [];
    return await fetch(
      "/api/dicts/jmdict/kanjiAndKana/" + (kanji || "") + ";" + (kana || ""),
    ).then((res) => res.json());
  },
  async lookupTag(tag: string): Promise<string> {
    const meta = await jmdict.getMetadata();
    return meta.tags[tag];
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
