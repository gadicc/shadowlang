import React from "react";

import { IconButton, Stack } from "@mui/material";
import {
  Add,
  ArrowDownward,
  ArrowDropDown,
  ArrowDropUp,
  ArrowUpward,
  CheckBox,
  Delete,
  Search,
} from "@mui/icons-material";

import type { BlockWord } from "./types";
import Reading from "./Reading";
import PartOfSpeech from "./PartOfSpeech";
import useJmDictModal from "./useJmDictModal";
import { jmdict } from "@/dicts";
import * as _ from "radash";

const playRange = _.debounce(
  { delay: 500 },
  function playRange(sound: Howl, start: number, end: number) {
    // @ts-expect-error: ok
    sound._sprite.word = [start * 1000, (end - start) * 1000];
    sound.play("word");
  },
);

export default function EditRow({
  word,
  i,
  words,
  setWords,
  sound,
}: {
  word: BlockWord;
  i: number;
  words: BlockWord[];
  setWords: (words: BlockWord[]) => void;
  sound: Howl;
}) {
  const { openJmDict, JmDictModal, jmDictProps } = useJmDictModal();

  const setWord = React.useCallback(
    (newWord: BlockWord) => {
      const newWords = [...words];
      newWords[i] = newWord;
      setWords(newWords);
    },
    [words, setWords, i],
  );

  // Need these as strings to allow insertion of decimal point :)
  const [start, _setStart] = React.useState(word.start?.toFixed(2) || "");
  const [end, _setEnd] = React.useState(word.end?.toFixed(2) || "");
  const [alsoAccept, _setAlsoAccept] = React.useState(
    word.alsoAccept?.join(","),
  );

  const setStart = React.useCallback(
    (start: string) => {
      _setStart(start);
      setWord({
        ...word,
        start: parseFloat(start),
      });
    },
    [word, setWord],
  );
  const setEnd = React.useCallback(
    (end: string) => {
      _setEnd(end);
      setWord({
        ...word,
        end: parseFloat(end),
      });
    },
    [word, setWord],
  );
  const setAlsoAccept = React.useCallback(
    (alsoAcceptStr: string) => {
      _setAlsoAccept(alsoAcceptStr);
      setWord({
        ...word,
        alsoAccept: alsoAcceptStr
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
      });
    },
    [word, setWord],
  );

  const iconPadding = 0.2;

  return (
    <tr>
      <td width={100} align="center">
        <JmDictModal
          {...jmDictProps}
          setJmDictId={async (id: string) => {
            const newWords = [...words];
            newWords[i] = { ...newWords[i], jmdict_id: id };

            const entry = await jmdict.findById(id);

            const oneKana = entry?.kana?.[0]?.text;
            const oneKanji = entry?.kanji?.[0]?.text;
            if (oneKana) {
              if (oneKanji) {
                newWords[i].word = oneKanji;
                newWords[i].reading = oneKana;
              } else {
                newWords[i].word = oneKana;
                newWords[i].reading = oneKana;
              }
            }

            const oneSense = entry?.sense?.[0];
            if (oneSense) {
              let sensePos = oneSense.partOfSpeech[0];
              if (sensePos.startsWith("adj-")) sensePos = "adj";
              else if (sensePos.startsWith("n-") && sensePos !== "n-pn")
                sensePos = "n";
              newWords[i].partOfSpeech = sensePos;
            }

            setWords(newWords);
          }}
        />
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
      <td align="center">
        <a
          href="#"
          style={{ color: "inherit" }}
          onClick={(e) => {
            e.preventDefault();
            openJmDict({
              kanji: word.word,
              kana: word.reading,
              partsOfSpeech: word.partOfSpeech,
            });
          }}
        >
          {word.jmdict_id ? (
            <span title={word.jmdict_id}>
              <CheckBox
                fontSize="small"
                sx={{ verticalAlign: "middle", color: "#005000" }}
              />
            </span>
          ) : (
            <Search
              fontSize="small"
              sx={{ verticalAlign: "middle", color: "#a00" }}
            />
          )}
        </a>
      </td>
      {/* <td>{word.jmdict_sense_idx}</td> */}
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
      <td width={52}>
        <Stack direction="row" sx={{ background: "white" }}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            style={{
              width: 50,
              border: "none",
              marginLeft: 1,
              marginRight: 1,
            }}
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              playRange(sound, parseFloat(e.target.value), parseFloat(end));
            }}
          />
          <IconButton
            size="small"
            onClick={() => {
              const startFloat = parseFloat(start) + 0.05;
              setStart(startFloat.toFixed(2));
              playRange(sound, startFloat, parseFloat(end));
            }}
          >
            <ArrowDropUp fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              const startFloat = parseFloat(start) - 0.05;
              setStart(startFloat.toFixed(2));
              playRange(sound, startFloat, parseFloat(end));
            }}
          >
            <ArrowDropDown fontSize="small" />
          </IconButton>
        </Stack>
      </td>
      <td width={52}>
        {" "}
        <Stack direction="row" sx={{ background: "white" }}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            style={{
              width: 50,
              border: "none",
              marginLeft: 1,
              marginRight: 1,
            }}
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              playRange(sound, parseFloat(start), parseFloat(e.target.value));
            }}
          />
          <IconButton
            size="small"
            onClick={() => {
              const endFloat = parseFloat(end) + 0.05;
              setEnd(endFloat.toFixed(2));
              playRange(sound, parseFloat(start), endFloat);
            }}
          >
            <ArrowDropUp fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              const endFloat = parseFloat(end) - 0.05;
              setEnd(endFloat.toFixed(2));
              playRange(sound, parseFloat(start), endFloat);
            }}
          >
            <ArrowDropDown fontSize="small" />
          </IconButton>
        </Stack>
      </td>
      <td>
        <input
          type="text"
          style={{
            // width: 50,
            width: "100%",
            border: "none",
            marginLeft: 1,
            marginRight: 1,
          }}
          value={alsoAccept}
          onChange={(e) => setAlsoAccept(e.target.value)}
        />
      </td>
    </tr>
  );
}
