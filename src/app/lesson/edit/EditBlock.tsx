import React from "react";

import { Container, LinearProgress } from "@mui/material";

import EditRow from "./EditRow";
import TextBlock from "../[_id]/TextBlock";
import { WordEntry, BlockTranslations } from "./types";
import Translations from "./Translations";

export async function processor(text: string) {
  const request = await fetch("/api/jpSentence", {
    method: "POST",
    body: text,
  });
  const response = (await request.json()) as WordEntry[];
  return response;
}

export default function EditBlock() {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [isFetching, setIsFetching] = React.useState(false);
  const [words, setWords] = React.useState<WordEntry[]>([]);
  const [translations, setTranslations] = React.useState<BlockTranslations>({
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
