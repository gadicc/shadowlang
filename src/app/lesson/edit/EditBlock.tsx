import React from "react";

import { Container } from "@mui/material";

import EditRow from "./EditRow";
import { BlockWord, WordEntry, Lesson } from "./types";

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

  let words: BlockWord[];
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
  console.log("processorWords", words);
  mergeBlockIdx(i, { words, status: undefined });
  return false;
}

export default function EditBlock({
  block,
  i,
  mergeBlockIdx,
  matchTimestampsAll,
}: {
  block: Lesson["blocks"][0];
  i: number;
  mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>): void;
  matchTimestampsAll: (i?: number) => Promise<void>;
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
  const setWords = (words: BlockWord[]) => mergeBlockIdx(i, { words });

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
        onClick={async () => {
          // we do this in lesson/edit/page.tsx too (but translate after)
          await analyzeBlockSentence(block, i, mergeBlockIdx);
          await matchTimestampsAll(i);
        }}
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
            <th>start</th>
            <th>end</th>
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
