import React from "react";

import { Container, LinearProgress } from "@mui/material";

import EditRow from "./EditRow";
import TextBlock from "../[_id]/TextBlock";
import { WordEntry, BlockTranslations, Lesson } from "./types";
import Translations from "./Translations";

export async function processor(text: string) {
  const request = await fetch("/api/jpSentence", {
    method: "POST",
    body: text,
  });
  const response = (await request.json()) as WordEntry[];
  return response;
}

export async function analyzeBlockSentence(
  block: Lesson["blocks"][0],
  i: number,
  mergeBlockIdx: (i: number, blockMerge: Partial<Lesson["blocks"][0]>) => void,
) {
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

export default function EditBlock({
  block,
  i,
  mergeBlockIdx,
}: {
  block: Lesson["blocks"][0];
  i: number;
  mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>): void;
}) {
  /*
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [words, setWords] = React.useState<WordEntry[]>([]);
  const [translations, setTranslations] = React.useState<BlockTranslations>({
    en: [],
  });
  console.log("words", words);
  */
  const words = block.words;
  const setWords = (words: WordEntry[]) => mergeBlockIdx(i, { words });

  return (
    <Container sx={{ my: 2 }}>
      <textarea
        // ref={ref}
        style={{ width: "100%" }}
        value={block.text}
        onChange={(e) => mergeBlockIdx(i, { text: e.target.value })}
        // defaultValue="私はアンミンです。"
      />
      <button
        disabled={block.status?.title === "Analyzing"}
        style={{ width: 150, height: "2em" }}
        onClick={() => analyzeBlockSentence(block, i, mergeBlockIdx)}
      >
        {/* block.status?.title === "Analyzing" ? <LinearProgress /> : "Analyze" */}
        Analyze
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
    </Container>
  );
}
