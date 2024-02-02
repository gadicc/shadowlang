import React from "react";

import { IconButton } from "@mui/material";
import { Add, ArrowDownward, ArrowUpward, Delete } from "@mui/icons-material";

import type { BlockWord } from "./types";
import Reading from "./Reading";
import PartOfSpeech from "./PartOfSpeech";

export default function EditRow({
  word,
  i,
  words,
  setWords,
}: {
  word: BlockWord;
  i: number;
  words: BlockWord[];
  setWords: (words: BlockWord[]) => void;
}) {
  const iconPadding = 0.2;
  const setWord = React.useCallback(
    (newWord: BlockWord) => {
      const newWords = [...words];
      newWords[i] = newWord;
      setWords(newWords);
    },
    [words, setWords, i],
  );

  return (
    <tr>
      <td>
        <IconButton
          size="small"
          disabled={i === 0}
          sx={{ padding: iconPadding }}
          onClick={() => {
            const newWords = [...words];
            newWords[i] = words[i - 1];
            newWords[i - 1] = words[i];
            setWords(newWords);
          }}
        >
          <ArrowUpward fontSize="inherit" />
        </IconButton>
        <IconButton
          size="small"
          disabled={i >= words.length}
          sx={{ padding: iconPadding }}
          onClick={() => {
            const newWords = [...words];
            newWords[i] = words[i + 1];
            newWords[i + 1] = words[i];
            setWords(newWords);
          }}
        >
          <ArrowDownward fontSize="inherit" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ padding: iconPadding }}
          onClick={() => {
            const newWords = [...words];
            // @ts-expect-error: ok for now
            newWords.splice(i, 0, { word: "", matches: [] });
            setWords(newWords);
          }}
        >
          <Add fontSize="inherit" />
        </IconButton>
        <IconButton
          size="small"
          sx={{ padding: iconPadding }}
          onClick={() => {
            const newWords = [...words];
            newWords.splice(i, 1);
            setWords(newWords);
          }}
        >
          <Delete fontSize="inherit" />
        </IconButton>
      </td>
      <td>
        <input
          type="text"
          style={{
            width: "100%",
            border: "none",
          }}
          value={word.word}
          onChange={(e) => setWord({ ...word, word: e.target.value })}
        />
      </td>
      <td>
        <Reading word={word} setWord={setWord} />
      </td>
      <td>
        <PartOfSpeech word={word} setWord={setWord} />
      </td>
      <td>{word.jmdict_id}</td>
      <td>{word.jmdict_sense_idx}</td>
      <td>
        <input
          type="text"
          style={{
            width: 50,
            border: "none",
            marginLeft: 1,
            marginRight: 1,
          }}
          value={word.start || ""}
          onChange={(e) =>
            setWord({
              ...word,
              start: parseFloat(e.target.value),
            })
          }
        />
      </td>
      <td>
        {" "}
        <input
          style={{ width: 50, border: "none" }}
          type="text"
          value={word.end || ""}
          onChange={(e) =>
            setWord({
              ...word,
              end: parseFloat(e.target.value),
            })
          }
        />
      </td>
    </tr>
  );
}
