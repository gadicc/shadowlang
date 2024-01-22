"use client";
import React from "react";
import hepburn from "hepburn";
// @ts-expect-error: no types
import { ReactFuri } from "react-furi";

import { Stack } from "@mui/material";

// https://www.edrdg.org/jmwsgi/edhelp.py?svc=jmdict&sid=#kw_pos
const colors = {
  // Based on https://etcmontessorionline.com/grammar-command-cards-parts-of-speech-on-plastic-cut/
  // n: "black",
  art: "turquoise",
  adj: "navy",
  v: "red",
  prep: "green",
  adv: "orange",
  pn: "purple",
  conj: "pink",
  int: "gold",
  // And our own
  exp: "#070",
  // prt: "gray",
  // "n-pr": "#aa0",
  // cop: "magenta",
  // Japanese Ammo with Misa colors
  cop: "#66c1ce",
  n: "#7bd07d",
  prt: "#cfacc4",
  "n-pr": "#dfb500", // "#bcad6b",
};

interface Word {
  word: string;
  reading?: string;
  start: number;
  end: number;
  punctuation?: string;
  partOfSpeech?:
    | "n"
    | "n-pn"
    | "art"
    | "adj"
    | "v"
    | "prep"
    | "adv"
    | "pn"
    | "conj"
    | "int"
    | "exp";
  role?: string;
  alsoAccept?: string[];
}

function LayoutWords({ words }: { words: Word[] }) {
  return (
    <div>
      {words.map((word, i) => (
        <span key={i} style={{ whiteSpace: "nowrap" }}>
          <span
            style={{
              // @ts-expect-error: TODO, align types
              color: word.partOfSpeech ? colors[word.partOfSpeech] : "",
              // textShadow: "0 0 1px #555",
            }}
          >
            {word.reading ? (
              <ReactFuri word={word.word} reading={word.reading} />
            ) : (
              word.word
            )}
          </span>
          <span
            style={{ verticalAlign: "bottom", lineHeight: 1, fontSize: 24 }}
          >
            {word.punctuation}
          </span>
        </span>
      ))}
    </div>
  );
}

function LayoutHepburn({ words }: { words: Word[] }) {
  return (
    <div style={{ whiteSpace: "discard" }}>
      {words.map((word, i) => (
        <span key={i} style={{ wordBreak: "break-word" }}>
          <span
            style={{
              // @ts-expect-error: TODO, align types
              color: word.partOfSpeech ? colors[word.partOfSpeech] : "",
              // textShadow: "0 0 1px #555",
            }}
          >
            {hepburn.fromKana(word.reading || word.word).toLocaleLowerCase()}
          </span>
          {word.punctuation}
        </span>
      ))}
    </div>
  );
}

function LayoutTranslation({
  words,
  translation,
}: {
  words: Word[];
  translation: { text: string; punctuation?: string; wordIdx: number }[];
}) {
  return (
    <div>
      {translation.map((word, i) => (
        <span key={i}>
          <span
            style={{
              color: words[word.wordIdx].partOfSpeech
                ? // @ts-expect-error: TODO, align types
                  colors[words[word.wordIdx].partOfSpeech]
                : "",
              // textShadow: "0 0 1px #555",
            }}
          >
            {word.text}
          </span>
          {word.punctuation}
        </span>
      ))}
    </div>
  );
}

export default function TextBlock({
  text,
  words,
  avatar,
  isCurrent,
  audio,
  translations,
}: {
  text: string;
  words: Word[];
  avatar: string;
  isCurrent: boolean;
  audio: { src: string; start: number; end: number };
  translations: {
    en: { text: string; punctuation?: string; wordIdx: number }[];
  };
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [done, setDone] = React.useState(false);

  const isCorrect = false;
  const [isListening, setIsListening] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const hasPlayed = React.useRef(false);
  const translation = translations?.en;
  // console.log({ results });

  return (
    <>
      <audio ref={audioRef} src={"/audio/" + audio.src} />

      <Stack direction="row" spacing={2}>
        <div>
          <div
            style={{
              boxSizing: "content-box",
              height: 70,
              width: 70,
              borderRadius: "50%",
              border: isCurrent ? "2px solid blue" : "1px solid black",
              margin: isCurrent ? 0 : 1,
            }}
          >
            <img
              alt={avatar + " avatar"}
              src={`/img/avatars/${avatar}.png`}
              width={70}
              height={70}
            />
          </div>
        </div>

        <div>
          {words.length ? (
            <>
              <LayoutWords words={words} />
              <div style={{ opacity: 0.65 }}>
                <LayoutHepburn words={words} />
                {translations ? (
                  <LayoutTranslation translation={translation} words={words} />
                ) : null}
              </div>
            </>
          ) : (
            <div style={{ color: isPlaying ? "blue" : "" }}>{text}</div>
          )}
          {isListening ? "🎤" : ""}
          <div>
            {/*
          {result} {isFinal ? (isCorrect ? "✅" : "❌") : ""}
          */}
          </div>
          <br />
        </div>
      </Stack>
    </>
  );
}
