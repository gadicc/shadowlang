import React from "react";
import { Howl } from "howler";

import { Container } from "@mui/material";

import EditRow from "./EditRow";
import { BlockWord, WordEntry, Lesson } from "./types";
import { CheckBox, Search } from "@mui/icons-material";

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
  lessonAudio,
  mergeBlockIdx,
  matchTimestampsAll,
  setLesson,
  getLesson,
}: {
  block: Lesson["blocks"][0];
  i: number;
  lessonAudio?: Lesson["audio"];
  mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>): void;
  matchTimestampsAll: (i?: number) => Promise<void>;
  setLesson(lesson: Partial<Lesson>): void;
  getLesson(): Partial<Lesson>;
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
  // console.log("EditBlock", { lessonAudio });

  const blockIdx = i;
  const words = block.words;
  const setWords = (words: BlockWord[]) => mergeBlockIdx(i, { words });
  const audioSrc =
    block?.audio?.src ||
    (lessonAudio && "/api/file2?sha256=" + lessonAudio.sha256) ||
    "";
  const sound = React.useMemo(() => {
    return new Howl({ src: [audioSrc], format: "m4a" });
  }, [audioSrc]);

  return (
    <Container sx={{ mt: 2 }}>
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
      <table
        border={1}
        cellSpacing={0}
        width="100%"
        style={{ background: "#fafafa" }}
      >
        <thead>
          <tr>
            <th>Actions</th>
            <th>Dict</th>
            {/* <th>senseIdx</th> */}
            <th>Word</th>
            <th>Reading</th>
            <th>
              <a title="Part of Speech">PoS</a>
            </th>
            <th>start</th>
            <th>end</th>
            <th>
              <span title="A comma separated list of alternative words that will also be accepted (used for speech recognition misses)">
                alsoAccept
              </span>
            </th>
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
              sound={sound}
              setLesson={setLesson}
              getLesson={getLesson}
              blockIdx={blockIdx}
            />
          ))}
        </tbody>
      </table>

      <div style={{ fontSize: "80%", marginTop: "10px" }}>
        Start with <b>Dict</b>; click on the
        <Search fontSize="small" sx={{ verticalAlign: "middle" }} />
        to search. The{" "}
        <CheckBox fontSize="small" sx={{ verticalAlign: "middle" }} /> means we
        automatically found a good match (but you can still change it). Then
        make sure the other fields are correct... click on a field to edit it.
      </div>
    </Container>
  );
}
