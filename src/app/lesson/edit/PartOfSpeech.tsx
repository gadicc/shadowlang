import React from "react";

import { partsOfSpeech } from "@/lib/jmdict";
import type { WordEntry } from "./types";

export default function PartOfSpeech({
  word,
  setWord,
}: {
  word: WordEntry;
  setWord: (word: WordEntry) => void;
}) {
  return (
    <select
      value={word.partOfSpeech}
      onChange={(e) => {
        const newWord = { ...word, partOfSpeech: e.target.value };
        setWord(newWord);
      }}
    >
      {partsOfSpeech.map((pos) => (
        <option key={pos} value={pos}>
          {pos}
        </option>
      ))}
    </select>
  );
}
