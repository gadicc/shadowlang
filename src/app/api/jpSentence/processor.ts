import Kuroshiro from "@sglkc/kuroshiro";
import KuromojiAnalyzer from "@sglkc/kuroshiro-analyzer-kuromoji";
import { toHiragana, isKatakana, isKana } from "wanakana";
import type { JMdictWord } from "@scriptin/jmdict-simplified-types";

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
  reading?: string;
  partOfSpeech?: string;
  jmdict_id?: string;
  jmdict_sense_idx?: number;
}

const kuromojiAnalyzer = new KuromojiAnalyzer();

const kuroshiro = new Kuroshiro();
const kuroshiroReady = kuroshiro.init(kuromojiAnalyzer); // a promise

/*
function lookupId(id: string) {
  return db.collection<JMdictWord>("jmdict").findOne({ id: id });
}
*/

function lookupKanji(kanji: string) {
  return lookupObj.kanji[kanji] || [];
}

function lookupKana(kana: string) {
  return lookupObj.kana[kana] || [];
}

export function getLastWord(morphemes: Morpheme[]) {
  let lastWord = "";
  let lastMatchedWord = null as string | null;
  let lastMatches = [] as string[];
  let numMorphenesMatched = 0;
  for (let i = morphemes.length - 1; i >= 0; i--) {
    const morpheme = morphemes[i];
    if (morpheme.pos === "記号") break; // symbol

    const currentWord = morpheme.surface_form + lastWord;
    let currentMatches = isKana(currentWord)
      ? lookupKana(currentWord)
      : lookupKanji(currentWord);

    if (!currentMatches.length) {
      const deinflectedWords = deinflector.deinflect(
        currentWord,
      ) as DeinflectedWord[];
      for (const deinflectedWord of deinflectedWords) {
        currentMatches = currentMatches.concat(
          isKana(deinflectedWord.term)
            ? lookupKana(deinflectedWord.term)
            : lookupKanji(deinflectedWord.term),
        );
      }
    }

    console.log("currentWord", currentWord, "currentMatches", currentMatches);

    lastWord = currentWord;

    if (currentMatches.length) {
      lastMatchedWord = currentWord;
      lastMatches = currentMatches;
      numMorphenesMatched = morphemes.length - i;
    }
  }

  if (lastMatches.length) {
    return {
      word: lastMatchedWord!,
      matches: lastMatches,
      numMorphenes: numMorphenesMatched,
      morpheme:
        numMorphenesMatched === 1 ? morphemes[morphemes.length - 1] : undefined,
    };
  } else {
    return {
      word: morphemes[morphemes.length - 1].surface_form,
      matches: [],
      numMorphenes: 1,
      morpheme: morphemes[morphemes.length - 1],
    };
  }
}

function morphemesToWords(morphemes: Morpheme[]) {
  // console.log("morphemes", morphemes);
  const _morphemes = morphemes.slice();
  const words = [];
  while (_morphemes.length) {
    words.push(getLastWord(_morphemes));
    _morphemes.splice(-words[words.length - 1].numMorphenes);
  }
  words.reverse();
  // console.log("words", words);
  return words;
}

async function lookupJmdictIds(
  words: { word: string; matches: string[]; morpheme?: Morpheme }[],
) {
  // Let's collect all IDs in advance so we can fetch in a single request
  const jmdict_ids = [] as string[];
  for (const word of words) {
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

  const out2 = new Array<WordEntry>(words.length);
  for (let i = 0; i < words.length; i++) {
    out2[i] = {
      word: words[i].word,
      morpheme: words[i].morpheme || undefined,
      matches: (
        await Promise.all(words[i].matches.map((id) => jmdict_entries[id]))
      ).filter(Boolean),
    };
  }

  return out2;
}

/*
// Moved from end of sentence, concatenating sequential morphemes
// and checking if they exist in the dictionary.  If so, continue
// until we find the max consecutive moprhemes that match a word.
//
// Unfortunately this didn't always work, so instead we moved
// (above) to try find max number of consecutive morphemes that
// form a word even if interim morphemes don't match a word.
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
    } /* i.e. if no matching word */ /* else {
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
}
*/

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
    const partOfSpeech = posMap[word.morpheme.pos];
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

    if (word.morpheme) {
      const preFilterMatches = word.matches;
      word.matches = word.matches.filter((match) =>
        match.kana.some((kana) => kana.text === word.reading),
      );
      if (!word.matches.length) word.matches = preFilterMatches;
    }

    // If we have an exact match on jmdict, prefill...
    if (word.matches.length === 1) {
      word.jmdict_id = word.matches[0].id;
      if (word.matches[0].kana.length === 1)
        word.reading = word.matches[0].kana[0].text;

      const poses = word.matches[0].sense
        .flatMap((sense) => sense.partOfSpeech)
        // Unique entries only;
        .filter((value, index, array) => array.indexOf(value) === index);
      if (poses.length === 1) word.partOfSpeech = poses[0];
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

    if (word.matches.length === 1 && word.partOfSpeech !== undefined) {
      const partOfSpeech = word.partOfSpeech;
      const match = word.matches[0];
      const filteredSense = match.sense.filter((sense) =>
        sense.partOfSpeech.includes(partOfSpeech),
      );
      if (filteredSense.length === 1)
        word.jmdict_sense_idx = match.sense.indexOf(filteredSense[0]);
    }

    if (word.partOfSpeech?.startsWith("v")) word.partOfSpeech = "v";
    if (word.word === "は" && word.partOfSpeech === "prt") word.reading = "わ";
  }
}

export default async function processor(sentence: string, stage?: string) {
  await kuroshiroReady;
  const morphemes = await kuromojiAnalyzer.parse(sentence.replace(/\s/g, ""));
  const _words = morphemesToWords(morphemes);
  const words = await lookupJmdictIds(_words);

  // console.log("morphemes", morphemes);
  // console.log("words", JSON.stringify(words, null, 2));

  if (stage === "words") return words;

  filterMatches(words);
  augmentWords(words);

  return words;
}

export type { JMdictWord };
export { db };
