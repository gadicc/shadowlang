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
  /*
  return db
    .collection<JMdictWord>("jmdict")
    .find({ "kanji.text": kanji })
    .toArray();
  */
}

function lookupKana(kana: string) {
  return lookupObj.kana[kana] || [];
  /*
  return db
    .collection<JMdictWord>("jmdict")
    .find({ "kana.text": kana })
    .toArray();
  */
}

/*
export async function getLastWord(morphemes: Morpheme[]) {
  let word = "";
  let lastSuccessfulWord;
  let lastSuccessfulMatch;
  let lastSuccessfulIndex = -1;

  for (let i = morphemes.length - 1; i >= 0; i--) {
    word = morphemes[i].surface_form + word;
    console.log("word", word);

    let matches = await (isKana(word) ? lookupKana(word) : lookupKanji(word));
    console.log("matches", matches);

    if (!matches.length) {
      const currentWord = "聞かれました";
      const deinflectedWords = deinflector.deinflect(
        currentWord,
      ) as DeinflectedWord[];
      for (const deinflectedWord of deinflectedWords) {
        console.log("deinflectedWord", deinflectedWord);
        matches = matches.concat(
          await (isKana(deinflectedWord.term)
            ? lookupKana(deinflectedWord.term)
            : lookupKanji(deinflectedWord.term)),
        );
      }
      console.log("new matches", matches);
    }

    if (matches.length) {
      lastSuccessfulIndex = i;
      lastSuccessfulMatch = matches;
      lastSuccessfulWord = word;
    }
  }

  return {
    word: lastSuccessfulWord,
    matches: lastSuccessfulMatch,
    idx: lastSuccessfulIndex,
  };
}

async function morphemesToWords(morphemes: Morpheme[]) {
  const { word, matches, idx } = await getLastWord(morphemes);
  console.log({ word, matches, idx });
}
*/

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
          matches: currentMatches,
          morpheme: morphemeCount === 0 ? morpheme : undefined,
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
          matches: [],
          morpheme: morpheme,
        });
        continue;
      }
      // Otherwise, output the last successfully matched word and continue.
      out.push({
        word: lastWord,
        matches: lastMatches,
        morpheme: morphemeCount === 1 ? lastMorpheme : undefined,
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
  for (const word of out) {
    // @ts-expect-error
    word.matches = (
      await Promise.all(word.matches.map((id) => lookupId(id)))
    ).filter(Boolean);
  }

  return out;
}

export default async function processor(sentence: string, stage?: string) {
  await kuroshiroReady;
  const morphemes = await kuromojiAnalyzer.parse(sentence.replace(/\s/g, ""));
  const words = await morphemesToWords(morphemes);

  // console.log("morphemes", morphemes);
  // console.log("words", words);

  if (stage === "words") return words;

  return words;
}

export { db };
