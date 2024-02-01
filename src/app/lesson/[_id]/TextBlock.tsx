"use client";
import React from "react";
import hepburn from "hepburn";
// @ts-expect-error: no types
import { ReactFuri } from "react-furi";

import { LinearProgress, Stack } from "@mui/material";
import { BlockTranslations, Speaker } from "../edit/types";
import type { Speaker as DBSpeaker, Lesson } from "@/schemas";
import Image from "next/image";

export function useMergeSpeakers(
  lessonSpeakers: Speaker[] | undefined,
  dbSpeakers: DBSpeaker[],
) {
  return React.useMemo(
    () =>
      lessonSpeakers
        ? lessonSpeakers?.map((speaker) => ({
            ...speaker,
            ...(dbSpeakers?.find(
              (dbSpeaker) => dbSpeaker._id === speaker.speakerId,
            ) || {}),
          }))
        : [],
    [lessonSpeakers, dbSpeakers],
  );
}

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

/*
<button class="mic-button-button listening" style="margin-top: 15px; box-shadow: 0px 0px 0px 4.38433px;"></button>
 transition-duration: .15s;
.mic-button.light .mic-button-button {
   color: var(--color-mic-button-box-shadow-light);
}
.mic-button .mic-button-button:disabled, .mic-button .mic-button-button:disabled:hover {
    opacity: .5;
}
.mic-button .mic-button-button {
    background-color: var(--color-white);
    border: 1px solid var(--color-line-light);
    border-radius: 100%;
    color: var(--color-mic-button-box-shadow);
    display: flex;
    padding: var(--spacing-xs);
    transition-duration: 1s;
    transition-property: box-shadow;
}
*/

function useAudio(
  audioRef: React.RefObject<HTMLAudioElement>,
  words: Word[],
  start: number,
  end: number,
  avatarRef?: React.RefObject<HTMLDivElement>,
) {
  // console.log("useAudio");
  const [isPlaying, _setIsPlaying] = React.useState(false);
  const isPlayingRef = React.useRef(isPlaying);
  const setIsPlaying = React.useCallback(
    (bool: boolean) => {
      if (bool === isPlayingRef.current) return;
      isPlayingRef.current = bool;
      _setIsPlaying(bool);
    },
    [isPlayingRef],
  );

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
        if (avatarRef?.current) avatarRef.current.style.boxShadow = "";
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
    [audioRef, words, end, setIsPlaying, setPlayingWordIdx, avatarRef],
  );

  React.useEffect(() => {
    const ref = audioRef.current;
    if (!ref) return;

    ref.addEventListener("timeupdate", timeupdate);
    return () => {
      ref.removeEventListener("timeupdate", timeupdate);
    };
  }, [audioRef, timeupdate]);

  const actxRef = React.useRef<AudioContext | null>(null);

  const play = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = start;
    setIsPlaying(true);

    // --- wave scope start ---
    // Adapted from https://stackoverflow.com/a/37021249/1839099
    // thanks user1693593
    let srcNode: MediaElementAudioSourceNode,
      bquad: BiquadFilterNode,
      analyser: AnalyserNode,
      fft: Uint8Array,
      fftLen: number;

    function setup(this: HTMLAudioElement) {
      if (srcNode || !audio || actxRef.current) return;
      audio.removeEventListener("canplay", setup);

      const actx = (actxRef.current = new AudioContext());

      srcNode = actx.createMediaElementSource(this);

      bquad = actx.createBiquadFilter();
      bquad.type = "lowpass";
      bquad.frequency.value = 250;

      analyser = actx.createAnalyser();
      analyser.fftSize = 256;

      // connect nodes: srcNode (input) -> analyzer -> destination (output)
      srcNode.connect(bquad);
      bquad.connect(analyser);

      srcNode.connect(actx.destination);
      fftLen = analyser.frequencyBinCount;
      fft = new Uint8Array(fftLen);

      const avatar = avatarRef?.current;
      if (!avatar) return;
      avatar.style.transitionDuration = ".05s";
      avatar.style.transitionProperty = "box-shadow";

      render();
    }
    function render() {
      // This was an easy way to avoid the calcs when not playing, but
      // really we should stop the requestAnimationFrame loop.  TODO.
      if (isPlayingRef.current) {
        // fill FFT buffer
        analyser.getByteFrequencyData(fft);
        // average data from some bands
        const v = (fft[1] + fft[2]) / 512;
        // console.log(v);

        const avatar = avatarRef?.current;
        if (!avatar) return;
        avatar.style.boxShadow =
          "0px 0px 0px " + 8 * v + "px rgba(100,100,100,0.3)";
      }

      requestAnimationFrame(render);
    }
    if (!actxRef.current) audio.addEventListener("canplay", setup);
    // --- wave scope end ---

    audio.play();
  }, [audioRef, start, setIsPlaying, avatarRef]);

  return { isPlaying, play, playingWordIdx };
}

export default React.memo(function TextBlock({
  text,
  words,
  speakers,
  speakerId,
  isCurrent,
  audio,
  translations,
  status,
  lessonAudio,
}: {
  text: string;
  words: Word[];
  speakers: Speaker[];
  speakerId: number;
  isCurrent: boolean;
  audio: Lesson["blocks"][0]["audio"];
  translations: BlockTranslations;
  status?: { title: string; showProgress: boolean; message?: string };
  lessonAudio?: Lesson["audio"];
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);
  // const [done, setDone] = React.useState(false);

  const speaker = speakers[speakerId];
  if (!speaker.url && !speaker.initials)
    speaker.initials = String.fromCharCode(65 + speakerId);

  // const isCorrect = false;
  const [isListening, _setIsListening] = React.useState(false);
  const translation = translations?.en;

  const lastIndex = words.findLastIndex(
    (word) => word.partOfSpeech !== "symbol",
  );
  const lastWord = words[lastIndex !== -1 ? lastIndex : words.length - 1];

  const { isPlaying, play, playingWordIdx } = useAudio(
    audioRef,
    words,
    typeof words?.[0]?.start === "number" ? words[0].start : audio.start,
    typeof lastWord?.end === "number" ? lastWord.end : audio.end,
    avatarRef,
  );
  // console.log({ results });
  const audioSrc =
    audio.src ||
    (lessonAudio && "/api/file2?sha256=" + lessonAudio.sha256) ||
    "";

  return (
    <>
      <audio ref={audioRef} src={audioSrc} />

      <Stack direction="row" spacing={2}>
        <div>
          <div
            ref={avatarRef}
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
            {speaker.url ? (
              <Image
                alt={speaker.name || "Speaker Avatar"}
                src={speaker.url}
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
                    speaker.initials === "A"
                      ? "blue"
                      : speaker.initials === "B"
                        ? "purple"
                        : speaker.initials === "C"
                          ? "navy"
                          : "pink",
                }}
              >
                {speaker.initials}
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
