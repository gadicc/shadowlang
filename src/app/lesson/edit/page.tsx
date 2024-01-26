"use client";
import React from "react";

import {
  Container,
  IconButton,
  LinearProgress,
  Typography,
} from "@mui/material";

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

function EditBlock() {
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

interface Lesson {
  title: {
    [key: string]: string;
  };
  speakers: {};
  blocks: {
    speakerId: number;
    text: string;
    words: WordEntry[];
    translations: Translations;
    audio: {
      src: string;
      start: number;
      end: number;
    };
    status?: {
      title: string;
      showProgress: boolean;
      message?: string;
    };
  }[];
}

function EditableLangTable({
  value,
  setValue,
  langs = ["en"],
}: {
  value: { [key: string]: string };
  setValue: (value: { [key: string]: string }) => void;
  langs?: string[];
}) {
  if (!langs) langs = Object.keys(value);
  return (
    <table border={1} cellSpacing={0} width="100%">
      <thead>
        <tr>
          <th>Lang</th>
          <th>Text</th>
        </tr>
      </thead>
      <tbody>
        {langs.map((lang) => (
          <tr key={lang}>
            <td>{lang}</td>
            <td>
              <input
                type="text"
                style={{ width: "100%" }}
                value={value[lang] || ""}
                onChange={(e) => {
                  const newValue = { ...value };
                  newValue[lang] = e.target.value;
                  setValue(newValue);
                }}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface Transcription {
  language: string;
  num_speakers: string;
  segments: {
    end: string;
    speaker: string;
    start: string;
    text: string;
    words: {
      end: number;
      start: number;
      word: string;
    }[];
  }[];
}

export default function Edit() {
  const [lesson, _setLesson] = React.useState<Partial<Lesson>>({});
  const latestLesson = React.useRef<Partial<Lesson>>();
  const transRef = React.useRef<Transcription>();

  const setLesson = React.useCallback(
    function setLesson(lesson: Partial<Lesson>) {
      latestLesson.current = lesson;
      _setLesson(lesson);
    },
    [_setLesson],
  );

  function mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>) {
    const lesson = latestLesson.current;
    if (!lesson)
      throw new Error("mergeBlockIdx called before latestLesson.current set");

    if (!lesson.blocks) lesson.blocks = [];

    const newBlock = { ...lesson.blocks[i], ...blockMerge };
    if (false)
      console.log("mergeBlockIdx", {
        i,
        orig: lesson!.blocks![i],
        newBlock,
      });

    const newBlocks = [...lesson.blocks];
    newBlocks[i] = newBlock;
    setLesson({ ...lesson, blocks: newBlocks });
  }

  async function processAudio() {
    const request = await fetch("/api/transcribe", {
      method: "POST",
      body: JSON.stringify({ src: "/audio/lesson1.mp3" }),
    });
    const result = (await request.json()) as Transcription;

    // Because we can't rely on the segmentation from the transcription,
    // we'll need this again later after the analysis to assign the
    // timestamps.
    transRef.current = result;

    const speakers: { [key: string]: { id: number; name: string } } = {};
    let speakerCount = 0;
    for (const seg of result.segments) {
      if (!speakers[seg.speaker])
        speakers[seg.speaker] = { id: speakerCount++, name: seg.speaker };
    }

    console.log(result);
    console.log({ speakers });

    const newLesson = { ...lesson };
    newLesson.speakers = Object.values(speakers);
    newLesson.blocks = result.segments.map((seg) => ({
      speakerId: speakers[seg.speaker].id,
      text: seg.text,
      words: [],
      translations: { en: [] },
      audio: {
        src: "1absolutebeginner_lesson1.m4a",
        start: parseFloat(seg.start),
        end: parseFloat(seg.end),
      },
    }));
    setLesson(newLesson);

    newLesson.blocks.forEach((block, i) => analyzeBlockSentence(block, i));
  }

  async function analyzeBlockSentence(block: Lesson["blocks"][0], i: number) {
    const text = block.text;
    if (!text) return;

    mergeBlockIdx(i, {
      status: {
        title: "Analyzing",
        showProgress: true,
      },
    });

    let words: WordEntry[];
    try {
      words = await processor(text);
    } catch (error) {
      console.error(error);
      mergeBlockIdx(i, {
        status: {
          title: "Analyzing",
          showProgress: false,
          message: "error",
        },
      });
      return false;
    }
    // console.log("processorWords", words);
    mergeBlockIdx(i, { words, status: undefined });
    return false;
  }

  return (
    <Container sx={{ my: 2 }}>
      <Typography variant="h6">Title</Typography>
      <EditableLangTable
        value={lesson?.title || {}}
        setValue={(title) => {
          if (!lesson) return;
          setLesson({ ...lesson, title });
        }}
      />
      <br />

      <Typography variant="h6">Audio</Typography>
      <div>TODO</div>
      <button onClick={processAudio}>Process</button>
      <br />

      <Typography variant="h6">Speakers</Typography>
      <br />

      <Typography variant="h6">Blocks</Typography>
      {lesson.blocks?.map((block, i) => (
        <div>
          <TextBlock
            key={i}
            text={block.text}
            avatar={String.fromCharCode(65 + block.speakerId)} // TODO
            audio={block.audio}
            words={block.words}
          />
          {block.status ? (
            <div style={{ paddingLeft: 85 }}>
              {block.status.title}{" "}
              {block.status.showProgress ? (
                <LinearProgress
                  sx={{
                    display: "inline-block",
                    width: 200,
                    verticalAlign: "middle",
                  }}
                />
              ) : null}
              {block.status.message}
            </div>
          ) : null}
        </div>
      ))}
    </Container>
  );
}
