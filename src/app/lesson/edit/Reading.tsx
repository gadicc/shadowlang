import React from "react";
import { isKatakana } from "wanakana";

import type { WordEntry } from "./types";

export default function Reading({
  word,
  setWord,
}: {
  word: WordEntry;
  setWord: (word: WordEntry) => void;
}) {
  if (isKatakana(word.word)) return null;
  if (word.partOfSpeech === "symbol") return null;

  const options: string[] = [];
  for (const match of word.matches) {
    for (const kana of match.kana) {
      if (!options.includes(kana.text)) options.push(kana.text);
    }
  }
  if (word.reading && !options.includes(word.reading))
    options.push(word.reading);

  return (
    <select
      value={word.reading}
      onChange={(e) => {
        const reading = e.target.value;
        const newWord = { ...word, reading };
        const filteredMatches = word.matches.filter((match) =>
          match.kana.some((kana) => kana.text === reading),
        );
        if (filteredMatches.length === 1) {
          // don't erase old match list, in case user wants to go back
          // newWord.matches = filteredMatches;

          newWord.jmdict_id = filteredMatches[0].id;
        }

        console.log(
          "word",
          word,
          "reading",
          reading,
          "filteredMatches",
          filteredMatches,
        );
        setWord(newWord);
      }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}