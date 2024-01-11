import type {
  JMdict,
  JMdictWord,
  Kanjidic2,
} from "@scriptin/jmdict-simplified-types";
import kanjidicJson from "./assets/kanjidic2-en-3.5.0.json";
import jmdictJson from "./assets/jmdict-eng-3.5.0.json";

const jmdict = jmdictJson as JMdict & {
  findById(id: string): Promise<JMdictWord | undefined>;
  findByKana(kanji: string): Promise<JMdictWord[]>;
  findByKanji(kanji: string): Promise<JMdictWord[]>;
  // findByReading(reading: string): Promise<JMdictWord | undefined>;
  // findByGloss(gloss: string): Promise<JMdictWord | undefined>;
};
const kanjidic = kanjidicJson as Kanjidic2;

if (typeof window !== "undefined") {
  // @ts-expect-error: ok
  window.jmdict = jmdict;
  // @ts-expect-error: ok
  window.kanjidic = kanjidic;
}

jmdict.findById = async function (id: string) {
  return jmdict.words.find((word) => word.id === id);
};

jmdict.findByKana = async function (kana: string) {
  return jmdict.words.filter((word) => word.kana.some((k) => k.text === kana));
};

jmdict.findByKanji = async function (kanji: string) {
  return jmdict.words.filter((word) =>
    word.kanji.some((k) => k.text === kanji),
  );
};

export { jmdict, kanjidic };
