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
import { partsOfSpeech } from "@/lib/jmdict";

const lookupObj = lookupObj_ as {
  kana: { [key: string]: string[] };
  kanji: { [key: string]: string[] };
};

const deinflector = new Deinflector(deinflectReasons);

export interface Morpheme {
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

export interface DeinflectedWord {
  term: string;
  rules: number;
  reasonss: string[];
}

export interface ProcessedWord {
  word: string;
  morpheme: Morpheme | undefined;
  matches: JMdictWord[];
}

export interface WordEntry extends ProcessedWord {
  jmdict_id?: string;
  reading?: string;
  partOfSpeech?: string;
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

  // Let's collect all IDs in advance so we can fetch in a single request
  const jmdict_ids = [];
  for (const word of out) {
    for (const jmdict_id of word.matches) {
      jmdict_ids.push(jmdict_id);
    }
  }

  const fetchStartTime = Date.now();
  const jmdict_entries = Object.fromEntries(
    (
      await db
        .collection<JMdictWord>("jmdict")
        .find({ id: { $in: jmdict_ids } })
        .toArray()
    ).map((entry) => [entry.id, entry]),
  );
  console.log(
    "Time to fetch " +
      jmdict_ids.length +
      " jmdict entries: " +
      (Date.now() - fetchStartTime),
  );

  const out2 = new Array<WordEntry>(out.length);
  for (let i = 0; i < out.length; i++) {
    out2[i] = {
      word: out[i].word,
      morpheme: out[i].morpheme || undefined,
      matches: (
        await Promise.all(out[i].matches.map((id) => jmdict_entries[id]))
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

function filterMatches(words: ProcessedWord[]) {
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

    if (word.matches.length) {
      // try match in this order
      for (const pos of [alt, pos_detail_1_en, partOfSpeech]) {
        if (!pos) continue;
        word.matches = word.matches.filter((match) =>
          match.sense.some((sense) => sense.partOfSpeech.includes(pos)),
        );
        /*
        console.log(
          "word",
          word.word,
          "pos",
          pos,
          "matches",
          word.matches.length,
        );
        */
        if (word.matches.length) break;
        else word.matches = preFilterMatches;
      }
    }
  }
}

function augmentWords(words: WordEntry[]) {
  for (const word of words) {
    // Set partOfSpeech from morphene (jmdict below will overwrite it)
    if (word.morpheme) {
      word.partOfSpeech = posMap[word.morpheme.pos];

      if (word.partOfSpeech && !partsOfSpeech.includes(word.partOfSpeech)) {
        if (word.partOfSpeech.startsWith("v")) {
          word.partOfSpeech = "v";
        } else {
          const pos = word.partOfSpeech.split("-")[0];
          if (partsOfSpeech.includes(pos)) word.partOfSpeech = pos;
        }
      }

      if (!word.reading && word.morpheme.reading)
        word.reading = toHiragana(word.morpheme.reading);
    }

    if (!word.reading) {
      if (isKana(word.word)) word.reading = toHiragana(word.word);
      if (isKatakana(word.word)) word.reading = word.word;
    }

    // If we have an exact match on jmdict, prefill...
    if (word.matches.length === 1) {
      word.jmdict_id = word.matches[0].id;
      if (word.matches[0].kana.length === 1)
        word.reading = word.matches[0].kana[0].text;
      if (word.matches[0].sense.length === 1)
        word.partOfSpeech = word.matches[0].sense[0].partOfSpeech[0];
    } else if (word.matches.length > 1) {
      // Figure out most common partOfSpeech
      const posCounts = {} as { [key: string]: number };
      for (const match of word.matches) {
        for (const sense of match.sense) {
          for (const pos of sense.partOfSpeech) {
            posCounts[pos] = (posCounts[pos] || 0) + 1;
          }
        }
      }
      let mostLikelyPoS = null as string | null;
      let mostLikelyPoSCount = 0;
      for (const [pos, count] of Object.entries(posCounts)) {
        if (count > mostLikelyPoSCount) {
          mostLikelyPoS = pos;
          mostLikelyPoSCount = count;
        }
      }
      if (mostLikelyPoS) word.partOfSpeech = mostLikelyPoS;
    }

    if (word.partOfSpeech?.startsWith("v")) word.partOfSpeech = "v";
    if (word.word === "は" && word.partOfSpeech === "prt") word.reading = "わ";
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
  augmentWords(words);

  return words;
}

export type { JMdictWord };
export { db };
