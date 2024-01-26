"use client";
import React from "react";

import { IconButton, LinearProgress } from "@mui/material";
import { Add, ArrowDownward, ArrowUpward, Delete } from "@mui/icons-material";

import type { WordEntry, BlockTranslations } from "./types";

export default function Translations({
  taRef: ref,
  words,
  translations,
  setTranslations,
}: {
  taRef: React.RefObject<HTMLTextAreaElement>;
  words: WordEntry[];
  translations: BlockTranslations;
  setTranslations: React.Dispatch<React.SetStateAction<BlockTranslations>>;
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

    const trans = (translations.en = result.parts as BlockTranslations["en"]);
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