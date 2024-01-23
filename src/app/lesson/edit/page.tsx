"use client";
import React from "react";

import { CircularProgress, Container, LinearProgress } from "@mui/material";

import { jmdict } from "@/dicts";
import { partsOfSpeech } from "@/lib/jmdict";
import type { WordEntry } from "@/app/api/jpSentence/processor";
import { posMap } from "@/lib/kuroshiro-pos";
import TextBlock from "../[_id]/TextBlock";
import { toKana, toHiragana, isKana, isKatakana } from "wanakana";
jmdict;

async function processor(text: string) {
  const request = await fetch("/api/jpSentence", {
    method: "POST",
    body: text,
  });
  const response = (await request.json()) as WordEntry[];
  return response;
}

if (typeof window !== "undefined") {
  // @ts-expect-error
  window.processor = processor;
}

function Reading({ word }: { word: WordEntry }) {
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
        <option key={pos} value={pos}>
          {pos}
        </option>
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
        style={{ width: 150, height: "2em" }}
        onClick={async () => {
          setIsFetching(true);
          const text = ref.current?.value;
          if (!text) return;
          const words = await processor(text);
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
