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
  const [customMode, setCustomMode] = React.useState(false);

  const options = React.useMemo(() => {
    const options: string[] = [];
    if (word.matches)
      for (const match of word.matches) {
        for (const kana of match.kana) {
          if (!options.includes(kana.text)) options.push(kana.text);
        }
      }
    if (word.reading && !options.includes(word.reading))
      options.push(word.reading);
    return options;
  }, [word]);

  React.useEffect(() => {
    if (word.reading === "__CUSTOM__" && !customMode) {
      setCustomMode(true);
      setWord({ ...word, reading: "" });
    }
  }, [word, customMode, setWord]);

  React.useEffect(() => {
    if (isKatakana(word.word) || word.partOfSpeech === "symbol") return;
    if (word.reading === undefined && options.length)
      setWord({ ...word, reading: options[0] });
  }, [options, word, setWord, customMode]);

  if (isKatakana(word.word)) return null;
  if (word.partOfSpeech === "symbol") return null;

  return customMode || options.length === 0 ? (
    <input
      type="text"
      style={{
        width: "100%",
        border: "none",
      }}
      value={word.reading}
      onChange={(e) => {
        const reading = e.target.value;
        setWord({ ...word, reading });
      }}
    />
  ) : (
    <select
      value={word.reading}
      onChange={(e) => {
        const reading = e.target.value;
        const newWord = { ...word, reading };
        const filteredMatches = word.matches
          ? word.matches.filter((match) =>
              match.kana.some((kana) => kana.text === reading),
            )
          : [];
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
      <option value="__CUSTOM__">(other)</option>
    </select>
  );
}
