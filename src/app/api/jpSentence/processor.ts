import Kuroshiro from "@sglkc/kuroshiro";
import KuromojiAnalyzer from "@sglkc/kuroshiro-analyzer-kuromoji";
import { toHiragana, isKatakana, isKana } from "wanakana";
import type {
  JMdict,
  JMdictWord,
  Kanjidic2,
  Kanjidic2Character,
} from "@scriptin/jmdict-simplified-types";

import { db } from "@/api-lib/db-full";
import deinflectReasons from "@/3rdparty/yomitan/deinflect.json";
import { Deinflector } from "@/3rdparty/yomitan/deinflector";
import lookupObj_ from "@/assets/jmdict-eng-3.5.0.lookup.json";
import { posMap, posDetail } from "@/lib/kuroshiro-pos";

const lookupObj = lookupObj_ as {
  kana: { [key: string]: string[] };
  kanji: { [key: string]: string[] };
};

const deinflector = new Deinflector(deinflectReasons);

interface Morpheme {
  surface_form: string;
  pos: string;
  pos_detail_1: string;
  pos_detail_2: string;
  pos_detail_3: string;
  conjugated_type: string;
  conjugated_form: string;
  basic_form: string;
  reading: string;
  pronunciation: string;
  verbose: {
    word_id: number;
    word_type: string;
    word_position: number;
  };
}

interface DeinflectedWord {
  term: string;
  rules: number;
  reasonss: string[];
}

const kuromojiAnalyzer = new KuromojiAnalyzer();

const kuroshiro = new Kuroshiro();
const kuroshiroReady = kuroshiro.init(kuromojiAnalyzer); // a promise

function lookupId(id: string) {
  return db.collection<JMdictWord>("jmdict").findOne({ id: id });
}

function lookupKanji(kanji: string) {
  return lookupObj.kanji[kanji] || [];
}

function lookupKana(kana: string) {
  return lookupObj.kana[kana] || [];
}

async function morphemesToWords(morphemes: Morpheme[]) {
  const out = [];

  let lastWord = "",
    lastMatches = [] as string[],
    lastMorpheme = null as Morpheme | null,
    morphemeCount = 0;
  for (let i = morphemes.length - 1; i >= 0; i--) {
    const morpheme = morphemes[i];
    const word = morpheme.surface_form;
    const readingKatakana = morpheme.reading || morpheme.pronunciation;

    const currentWord = word + lastWord;
    let currentMatches = await (isKana(currentWord)
      ? lookupKana(currentWord)
      : lookupKanji(currentWord));

    if (!currentMatches.length) {
      // const currentWord = "聞かれました";
      const deinflectedWords = deinflector.deinflect(
        currentWord,
      ) as DeinflectedWord[];
      for (const deinflectedWord of deinflectedWords) {
        currentMatches = currentMatches.concat(
          await (isKana(deinflectedWord.term)
            ? lookupKana(deinflectedWord.term)
            : lookupKanji(deinflectedWord.term)),
        );
      }
      // console.log("new matches", currentMatches);
    }

    // console.log({ currentWord, currentMatches });

    // Does currentWord (of 1 or more morphenes) match a word in the dictionary?
    if (currentMatches.length) {
      // If it's the first morpheme of the sentence (i.e. the last morpheme we process),
      // then there's no next round to check and we can output the word and end.
      if (i == 0) {
        out.push({
          word: currentWord,
          morpheme: morphemeCount === 0 ? morpheme : undefined,
          matches: currentMatches,
        });
        break;
      }

      // Otherwise, append to next moprheme and continue.
      lastWord = currentWord;
      lastMatches = currentMatches;
      lastMorpheme = morpheme;
      morphemeCount++;
    } /* i.e. if no matching word */ else {
      // If there's no match for a single morphene, there's nothing else
      // to do.  Just output word with morpheme data and continue.
      if (morphemeCount === 0) {
        out.push({
          word: word,
          morpheme: morpheme,
          matches: [],
        });
        continue;
      }
      // Otherwise, output the last successfully matched word and continue.
      out.push({
        word: lastWord,
        morpheme: morphemeCount === 1 ? lastMorpheme : undefined,
        matches: lastMatches,
      });
      lastWord = "";
      lastMatches = [];
      // Since this morpheme wasn't a part of the last word, start the
      // process again starting with that morpheme as a possible part
      // of the next word.
      i++;
      morphemeCount = 0;
    }
  }

  out.reverse();

  const out2 = new Array<{
    word: string;
    morpheme: Morpheme | undefined;
    matches: JMdictWord[];
  }>(out.length);
  for (let i = 0; i < out.length; i++) {
    out2[i] = {
      word: out[i].word,
      morpheme: out[i].morpheme || undefined,
      // @ts-expect-error: ok
      matches: (
        await Promise.all(out[i].matches.map((id) => lookupId(id)))
      ).filter(Boolean),
    };
  }

  return out2;
}

/*
function appendPunctuation(
  words: {
    word: string;
    matches: JMdictWord[];
    morpheme: Morpheme | undefined;
  }[],
) {
  const out = [];
  for (const word of words) {
    if (word.morpheme?.pos === "記号") {
      // @ts-expect-error
      out[out.length - 1].punctuation = word.word;
    } else {
      out.push(word);
    }
  }
  return out;
}
*/

function filterMatches(
  words: {
    word: string;
    matches: JMdictWord[];
    morpheme: Morpheme | undefined;
  }[],
) {
  for (const word of words) {
    if (!word.morpheme) continue;
    if (word.morpheme.pos === "記号") continue;
    let partOfSpeech = posMap[word.morpheme.pos];
    if (!partOfSpeech)
      console.warn(
        "Part of speech missing from posmap, skipping: ",
        word.morpheme.pos,
      );
    const pos_detail_1_en = posDetail[word.morpheme.pos_detail_1];

    // kiromoji sometimes returns aux-v for cop (e.g. "desu")
    const alt = partOfSpeech === "aux-v" ? "cop" : null;

    // console.log("word", word.word, "partOfSpeech", partOfSpeech);
    // console.log("before", word.matches.length);

    const preFilterMatches = word.matches;

    word.matches = word.matches.filter((match) =>
      match.sense.some(
        (sense) =>
          sense.partOfSpeech.includes(partOfSpeech) ||
          sense.partOfSpeech.includes(pos_detail_1_en) ||
          (alt && sense.partOfSpeech.includes(alt)),
      ),
    );

    // console.log("after", word.matches.length);

    if (word.matches.length === 0) word.matches = preFilterMatches;
  }
}

export default async function processor(sentence: string, stage?: string) {
  await kuroshiroReady;
  const morphemes = await kuromojiAnalyzer.parse(sentence.replace(/\s/g, ""));
  const words = await morphemesToWords(morphemes);

  // console.log("morphemes", morphemes);
  // console.log("words", JSON.stringify(words, null, 2));

  if (stage === "words") return words;

  filterMatches(words);

  return words;
}

export { db };
