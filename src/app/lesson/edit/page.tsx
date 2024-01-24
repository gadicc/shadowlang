"use client";
import React from "react";

import { Container, IconButton, LinearProgress } from "@mui/material";

import { jmdict } from "@/dicts";
import { partsOfSpeech } from "@/lib/jmdict";
import type { WordEntry } from "@/app/api/jpSentence/processor";
import TextBlock from "../[_id]/TextBlock";
import { isKatakana } from "wanakana";
import { Add, ArrowDownward, ArrowUpward, Delete } from "@mui/icons-material";
jmdict;

async function processor(text: string) {
  const request = await fetch("/api/jpSentence", {
    method: "POST",
    body: text,
  });
  const response = (await request.json()) as WordEntry[];
  return response;
}

function Reading({
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

function PartOfSpeech({
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

function EditRow({
  word,
  i,
  words,
  setWords,
}: {
  word: WordEntry;
  i: number;
  words: WordEntry[];
  setWords: React.Dispatch<React.SetStateAction<WordEntry[]>>;
}) {
  const iconPadding = 0.2;
  const setWord = React.useCallback(
    (newWord: WordEntry) => {
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
      <td>{word.word}</td>
      <td>
        <Reading word={word} setWord={setWord} />
      </td>
      <td>
        <PartOfSpeech word={word} setWord={setWord} />
      </td>
      <td>{word.jmdict_id}</td>
      <td>{word.jmdict_sense_idx}</td>
    </tr>
  );
}

interface Translations {
  [key: string]: {
    text: string;
    punctuation?: string;
    wordIdx?: number;
    word?: string;
  }[];
}

function Translations({
  taRef: ref,
  words,
  translations,
  setTranslations,
}: {
  taRef: React.RefObject<HTMLTextAreaElement>;
  words: WordEntry[];
  translations: Translations;
  setTranslations: React.Dispatch<React.SetStateAction<Translations>>;
}) {
  const [isFetching, setIsFetching] = React.useState(false);
  const iconPadding = 0.2;

  async function getTranslation(
    text: string,
    words: WordEntry[],
    targetLang = "English",
  ) {
    setIsFetching(true);

    const wordsToSend = words.map((word) => ({
      word: word.word,
      pos: word.partOfSpeech,
    }));

    const request = await fetch("/api/jpTranslate", {
      method: "POST",
      body: JSON.stringify({ text, words: wordsToSend, targetLang }),
    });

    const result = (await request.json()) as {
      translation: string;
      parts: {
        text: string;
        word: string | null;
        punctuation: string | null;
      }[];
    };
    console.log("result", result);

    const trans = (translations.en = result.parts as Translations["en"]);
    setIsFetching(false);
    setTranslations({ ...translations, en: trans });
  }

  return (
    <div>
      <div>
        Add translations:{" "}
        <button
          disabled={isFetching}
          style={{ width: 150, height: "2em" }}
          onClick={() => {
            const text = ref.current?.value;
            if (!text) return;
            getTranslation(text, words);
          }}
        >
          {isFetching ? <LinearProgress /> : "English"}
        </button>
      </div>
      <br />
      <table border={1} cellSpacing={0}>
        <tbody>
          {translations.en.map((entry, i) => (
            <tr key={entry.text}>
              <td>
                <IconButton
                  size="small"
                  disabled={i === 0}
                  sx={{ padding: iconPadding }}
                  onClick={() => {
                    const newTranslations = { ...translations };
                    newTranslations.en[i] = translations.en[i - 1];
                    newTranslations.en[i - 1] = translations.en[i];
                    setTranslations(newTranslations);
                  }}
                >
                  <ArrowUpward fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={i >= translations.en.length}
                  sx={{ padding: iconPadding }}
                  onClick={() => {
                    const newTranslations = { ...translations };
                    newTranslations.en[i] = translations.en[i + 1];
                    newTranslations.en[i + 1] = translations.en[i];
                    setTranslations(newTranslations);
                  }}
                >
                  <ArrowDownward fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ padding: iconPadding }}
                  onClick={() => {
                    const newTranslations = { ...translations };
                    translations.en.splice(i, 0, { text: "" });
                    setTranslations(newTranslations);
                  }}
                >
                  <Add fontSize="inherit" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ padding: iconPadding }}
                  onClick={() => {
                    const newTranslations = { ...translations };
                    newTranslations.en.splice(i, 1);
                    setTranslations(newTranslations);
                  }}
                >
                  <Delete fontSize="inherit" />
                </IconButton>
              </td>
              <td>
                <input
                  type="text"
                  value={entry.text}
                  onChange={(e) => {
                    translations.en[i] = {
                      ...entry,
                      text: e.target.value,
                    };
                    setTranslations({ ...translations });
                  }}
                />
              </td>
              <td>
                <select
                  value={entry.word}
                  onChange={(e) => {
                    translations.en[i] = {
                      ...entry,
                      word: e.target.value,
                    };
                    setTranslations({ ...translations });
                  }}
                >
                  <option></option>
                  {words.map((word) => (
                    <option key={word.word}>{word.word}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  type="text"
                  size={4}
                  value={entry.punctuation}
                  onChange={(e) => {
                    translations.en[i] = {
                      ...entry,
                      punctuation: e.target.value,
                    };
                    setTranslations({ ...translations });
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Edit() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [words, setWords] = React.useState<WordEntry[]>([]);
  const [translations, setTranslations] = React.useState<Translations>({
    en: [],
  });
  console.log("words", words);

  return (
    <Container sx={{ my: 2 }}>
      <textarea
        ref={ref}
        style={{ width: "100%" }}
        defaultValue="私はアンミンです。"
      />
      <button
        disabled={isFetching}
        style={{ width: 150, height: "2em" }}
        onClick={async () => {
          setIsFetching(true);
          const text = ref.current?.value;
          if (!text) return;
          let words: WordEntry[];
          try {
            words = await processor(text);
          } catch (error) {
            console.error(error);
            setIsFetching(false);
            return false;
          }
          console.log(words);
          setWords(words);
          setIsFetching(false);
          return false;
        }}
      >
        {isFetching ? <LinearProgress /> : "Add Sentence"}
      </button>
      <br />
      <br />
      <table border={1} cellSpacing={0} width="100%">
        <thead>
          <tr>
            <th></th>
            <th>Word</th>
            <th>Reading</th>
            <th>
              <a title="Part of Speech">PoS</a>
            </th>
            <th>jmdict_id</th>
            <th>senseIdx</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word, i) => (
            <EditRow
              key={i}
              word={word}
              i={i}
              words={words}
              setWords={setWords}
            />
          ))}
        </tbody>
      </table>
      <br />
      <TextBlock
        avatar="anming"
        // @ts-expect-error: later
        words={words}
        // @ts-expect-error: later
        audio={{ src: "" }}
        // @ts-expect-error: later
        translations={translations}
      />
      <Translations
        taRef={ref}
        translations={translations}
        setTranslations={setTranslations}
        words={words}
      />
    </Container>
  );
}