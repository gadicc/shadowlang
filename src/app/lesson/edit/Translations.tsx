"use client";
import React from "react";

import { IconButton } from "@mui/material";
import { Add, ArrowDownward, ArrowUpward, Delete } from "@mui/icons-material";

import type { BlockTranslations, Lesson } from "./types";

export async function translateBlockSentence(
  block: Lesson["blocks"][0],
  i: number,
  mergeBlockIdx: (i: number, blockMerge: Partial<Lesson["blocks"][0]>) => void,
  targetLang = "English",
) {
  mergeBlockIdx(i, {
    status: {
      title: "Translating",
      showProgress: true,
    },
  });

  const wordsToSend = block.words.map((word) => ({
    word: word.word,
    pos: word.partOfSpeech,
  }));

  const request = await fetch("/api/jpTranslate", {
    method: "POST",
    body: JSON.stringify({ text: block.text, words: wordsToSend, targetLang }),
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

  const trans = (block.translations.en =
    result.parts as BlockTranslations["en"]);
  mergeBlockIdx(i, {
    status: undefined,
    ...{ ...block.translations, en: trans },
  });
}

export default function Translations({
  block,
  i,
  mergeBlockIdx,
}: {
  block: Lesson["blocks"][0];
  i: number;
  // setTranslations: (translations: BlockTranslations) => void;
  mergeBlockIdx(i: number, blockMerge: Partial<Lesson["blocks"][0]>): void;
}) {
  const setTranslations = (translations: BlockTranslations) =>
    mergeBlockIdx(i, { translations });

  const iconPadding = 0.2;

  const { text, words, translations } = block;

  return (
    <div>
      <div>
        Add translations:{" "}
        <button
          disabled={block.status?.title === "Translating"}
          style={{ width: 150, height: "2em" }}
          onClick={() => {
            if (!text) return;
            translateBlockSentence(block, i, mergeBlockIdx, "English");
          }}
        >
          {/* isFetching ? <LinearProgress /> : "English" */}
          English
        </button>
      </div>
      <br />
      {translations.en.length > 0 ? (
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
                    {words.map((word, i) => (
                      <option key={i}>{word.word}</option>
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
      ) : null}
    </div>
  );
}
