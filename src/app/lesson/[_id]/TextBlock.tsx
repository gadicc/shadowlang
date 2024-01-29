"use client";
import React from "react";
import hepburn from "hepburn";
// @ts-expect-error: no types
import { ReactFuri } from "react-furi";

import { LinearProgress, Stack } from "@mui/material";
import { BlockTranslations } from "../edit/types";

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
  start?: number;
  end?: number;
  punctuation?: string;
  partOfSpeech?: string;
  /*
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
  */
  role?: string;
  alsoAccept?: string[];
}

function LayoutWords({
  words,
  playingWordIdx,
}: {
  words: Word[];
  playingWordIdx: number;
}) {
  // console.log("LayoutWords", words, "playingWordIndex", playingWordIdx);

  return (
    <div>
      {words.map((word, i) => (
        <span key={i} style={{ whiteSpace: "nowrap" }}>
          <span
            style={{
              // @ts-expect-error: TODO, align types
              color: word.partOfSpeech ? colors[word.partOfSpeech] : "",
              // textShadow: "0 0 1px #555",
              textShadow: playingWordIdx === i ? "0 0 2px #555" : "",
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

function LayoutHepburn({
  words,
  playingWordIdx,
}: {
  words: Word[];
  playingWordIdx: number;
}) {
  return (
    <div style={{ whiteSpace: "discard" }}>
      {words.map((word, i) => (
        <span key={i} style={{ wordBreak: "break-word" }}>
          <span
            style={{
              // @ts-expect-error: TODO, align types
              color: word.partOfSpeech ? colors[word.partOfSpeech] : "",
              // textShadow: "0 0 1px #555",
              textShadow: playingWordIdx === i ? "0 0 2px #555" : "",
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
  playingWordIdx,
}: {
  words: Word[];
  translation: {
    text: string;
    punctuation?: string;
    wordIdx?: number;
    word?: string;
  }[];
  playingWordIdx: number;
}) {
  return (
    <div>
      {translation.map((transWord, i) => {
        let word = null;
        if (transWord.wordIdx) word = words[transWord.wordIdx];
        else if (transWord.word)
          word = words.find((w) => w.word === transWord.word);

        // We use -2 otherwise -1 will match on translated
        // words that don't have a match in source words.
        const wordIdx = word ? words.indexOf(word) : -2;

        return (
          <span key={i}>
            <span
              style={{
                color: word?.partOfSpeech
                  ? // @ts-expect-error: TODO, align types
                    colors[word.partOfSpeech]
                  : "",
                // textShadow: "0 0 1px #555",
                textShadow: playingWordIdx === wordIdx ? "0 0 2px #555" : "",
              }}
            >
              {transWord.text}
            </span>
            {transWord.punctuation}
          </span>
        );
      })}
    </div>
  );
}

function useAudio(
  audioRef: React.RefObject<HTMLAudioElement>,
  words: Word[],
  start: number,
  end: number,
) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [playingWordIdx, _setPlayingWordIdx] = React.useState(-1);
  const playingWordIdxRef = React.useRef(playingWordIdx);
  const setPlayingWordIdx = React.useCallback(
    (i: number) => {
      if (i === playingWordIdxRef.current) return;
      playingWordIdxRef.current = i;
      _setPlayingWordIdx(i);
    },
    [playingWordIdxRef],
  );

  const timeupdate = React.useCallback(
    function timeupdate() {
      const audio = audioRef.current;
      if (!audio) return;

      const currentTime = audio.currentTime;

      if (currentTime >= end + 0.2) {
        audio.pause();
        setIsPlaying(false);
        setPlayingWordIdx(-1);
        return;
      }

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (!(word && word.start && word.end)) continue;
        if (currentTime > word.start && currentTime < word.end) {
          if (playingWordIdxRef.current !== i) {
            if (false)
              console.log(
                "currentTime",
                currentTime,
                "prev playingWordIndex",
                playingWordIdxRef.current,
                "next playingWordIndex",
                i,
              );
            setPlayingWordIdx(i);
          }
          break;
        }
      }
    },
    [audioRef, words, end, setPlayingWordIdx],
  );

  React.useEffect(() => {
    const ref = audioRef.current;
    if (!ref) return;

    ref.addEventListener("timeupdate", timeupdate);
    return () => {
      ref.removeEventListener("timeupdate", timeupdate);
    };
  }, [audioRef, timeupdate]);

  const play = React.useCallback(() => {
    const ref = audioRef.current;
    if (!ref) return;

    ref.currentTime = start;
    setIsPlaying(true);
    ref.play();
  }, [audioRef, start]);

  return { isPlaying, play, playingWordIdx };
}

export default React.memo(function TextBlock({
  text,
  words,
  avatar,
  isCurrent,
  audio,
  translations,
  status,
}: {
  text: string;
  words: Word[];
  avatar: string;
  isCurrent: boolean;
  audio: { src: string; start: number; end: number };
  translations: BlockTranslations;
  status?: { title: string; showProgress: boolean; message?: string };
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [done, setDone] = React.useState(false);

  const isCorrect = false;
  const [isListening, setIsListening] = React.useState(false);
  const translation = translations?.en;

  const { isPlaying, play, playingWordIdx } = useAudio(
    audioRef,
    words,
    audio.start,
    audio.end,
  );
  // console.log({ results });

  return (
    <>
      <audio ref={audioRef} src={"/audio/" + audio.src} />

      <Stack direction="row" spacing={2}>
        <div>
          <div
            onClick={play}
            style={{
              boxSizing: "content-box",
              height: 70,
              width: 70,
              borderRadius: "50%",
              border: isCurrent ? "2px solid blue" : "1px solid black",
              margin: isCurrent ? 0 : 1,
            }}
          >
            {avatar.includes(".") ? (
              <img
                alt={avatar + " avatar"}
                src={`/img/avatars/${avatar}`}
                width={70}
                height={70}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  borderRadius: "50%",
                  fontSize: "2rem",
                  lineHeight: 1,
                  userSelect: "none",
                  color: "white",
                  backgroundColor:
                    avatar === "A"
                      ? "blue"
                      : avatar === "B"
                        ? "purple"
                        : avatar === "C"
                          ? "navy"
                          : "pink",
                }}
              >
                {avatar}
              </div>
            )}
          </div>
        </div>

        <div>
          {words.length ? (
            <>
              <LayoutWords words={words} playingWordIdx={playingWordIdx} />
              <div style={{ opacity: 0.65 }}>
                <LayoutHepburn words={words} playingWordIdx={playingWordIdx} />
                {translations ? (
                  <LayoutTranslation
                    translation={translation}
                    words={words}
                    playingWordIdx={playingWordIdx}
                  />
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
          {status ? (
            <div>
              {status.title}{" "}
              {status.showProgress ? (
                <LinearProgress
                  sx={{
                    display: "inline-block",
                    width: 200,
                    verticalAlign: "middle",
                  }}
                />
              ) : null}
              {status.message}
            </div>
          ) : null}

          <br />
        </div>
      </Stack>
    </>
  );
});
