"use client";
import React from "react";

import { Container } from "@mui/material";

import { jmdict } from "@/dicts";
import type { JMdict } from "@scriptin/jmdict-simplified-types";
import type { ProcessedWord } from "@/app/api/jpSentence/processor";
import { posMap } from "@/lib/kuroshiro-pos";
import TextBlock from "../[_id]/TextBlock";
import { toKana, toHiragana, isKana, isKatakana } from "wanakana";
jmdict;

interface WordEntry extends ProcessedWord {
  jmdict_id?: string;
  reading?: string;
  partOfSpeech?: string;
}

async function processor(text: string) {
  const request = await fetch("/api/jpSentence", {
    method: "POST",
    body: text,
  });
  const response = await request.json();
  return response;
}

if (typeof window !== "undefined") {
  // @ts-expect-error
  window.processor = processor;
}

// https://www.edrdg.org/jmwsgi/edhelp.py?svc=jmdict&sid=#kw_pos
// (without all adj-*, n-*, v*; just most common), added 'symbol'
const partsOfSpeech = [
  "adj",
  "aux",
  "aux-adj",
  "aux-v",
  "conj",
  "cop",
  "ctr",
  "exp",
  "int",
  "n",
  "n-pr",
  "num",
  "pn",
  "prt",
  "suf",
  "unc",
  "v",
  // non jmdict
  "symbol",
];

function Reading({ word }: { word: WordEntry }) {
  if (isKatakana(word.word)) return null;
  if (word.partOfSpeech === "symbol") return null;

  // if (word.word === "は" && word.partOfSpeech === "prt") return "わ";

  const options = [];
  for (const match of word.matches) {
    for (const kana of match.kana) {
      options.push(kana.text);
    }
  }
  if (word.reading && !options.includes(word.reading))
    options.push(word.reading);

  return (
    <select
      value={word.reading}
      onChange={(e) => {
        word.reading = e.target.value;
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

function PartOfSpeech({ value, onChange }: { value?: string; onChange: any }) {
  return (
    <select
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
    >
      {partsOfSpeech.map((pos) => (
        <option value={pos}>{pos}</option>
      ))}
    </select>
  );
}

function EditRow({ word }: { word: WordEntry }) {
  return (
    <tr>
      <td>{word.word}</td>
      <td>
        <Reading word={word} />
      </td>
      <td>
        <PartOfSpeech value={word.partOfSpeech} />
      </td>
      <td>{word.jmdict_id}</td>
    </tr>
  );
}

export default function Edit() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [words, setWords] = React.useState<WordEntry[]>([]);

  return (
    <Container sx={{ my: 2 }}>
      <textarea
        ref={ref}
        style={{ width: "100%" }}
        defaultValue="私はアンミンです。"
      />
      <button
        disabled={isFetching}
        onClick={async () => {
          setIsFetching(true);
          const text = ref.current?.value;
          if (!text) return;
          const words = (await processor(text)) as WordEntry[];
          for (const word of words) {
            // Set partOfSpeech from morphene (jmdict below will overwrite it)
            if (word.morpheme) word.partOfSpeech = posMap[word.morpheme.pos];
            if (
              word.partOfSpeech &&
              !partsOfSpeech.includes(word.partOfSpeech)
            ) {
              if (word.partOfSpeech.startsWith("v")) {
                word.partOfSpeech = "v";
              } else {
                const pos = word.partOfSpeech.split("-")[0];
                if (partsOfSpeech.includes(pos)) word.partOfSpeech = pos;
              }
            }

            if (word.morpheme && !word.reading && word.morpheme.reading)
              word.reading = toHiragana(word.morpheme.reading);

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
              if (word.partOfSpeech?.startsWith("v")) word.partOfSpeech = "v";
            }

            if (word.word === "は" && word.partOfSpeech === "prt")
              word.reading = "わ";
          }
          console.log(words);
          setWords(words);
          setIsFetching(false);
          return false;
        }}
      >
        Add Sentence
      </button>
      <table border={1} cellSpacing={0}>
        <thead>
          <tr>
            <th>Word</th>
            <th>Reading</th>
            <th>
              <a title="Part of Speech">pos</a>
            </th>
            <th>jmdict_id</th>
          </tr>
        </thead>
        <tbody>
          {words.map((word) => (
            <EditRow word={word} />
          ))}
        </tbody>
      </table>
      <TextBlock avatar="anming" words={words} audio={{ src: "" }} />
    </Container>
  );
}
