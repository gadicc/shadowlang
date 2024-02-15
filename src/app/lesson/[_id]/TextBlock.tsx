"use client";
import React from "react";
import hepburn from "hepburn";
import Image from "next/image";

import { LinearProgress, Popover, Stack } from "@mui/material";

import { BlockTranslations, Speaker } from "../edit/types";
import { JMdictWord, type Speaker as DBSpeaker, type Lesson } from "@/schemas";
import posColors from "@/lib/pos-colors";
import { DictionaryEntry } from "../edit/useJmDictModal";
import { jmdict } from "@/dicts";
import useBreakPoint from "@/lib/useBreakPoint";
import Furigana from "@/lib/furigana";
import Tail from "@/lib/tail";

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
  play,
  breakpoint,
  showFuri = true,
}: {
  words: Word[];
  playingWordIdx: number;
  play: (range?: { start: number; end: number }) => void;
  breakpoint?: string;
  showFuri?: boolean;
}) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const handlePopoverClose = React.useCallback(
    () => setAnchorEl(null),
    [setAnchorEl],
  );
  const [jmdictWord, setJmDictWord] = React.useState<JMdictWord | null>(null);
  const open = Boolean(anchorEl);

  // console.log("LayoutWords", words, "playingWordIndex", playingWordIdx);

  return (
    <div>
      {words.map((word, i) => (
        <span
          key={i}
          style={{ whiteSpace: "nowrap" }}
          aria-owns={open ? "jmdict-popover" : undefined}
          aria-haspopup="true"
          onClick={async (event: React.MouseEvent<HTMLElement>) => {
            // @ts-expect-error: TODO
            if (!word.jmdict_id) return;
            setJmDictWord(null);
            setAnchorEl(event.currentTarget);
            // @ts-expect-error: TODO
            setJmDictWord(await jmdict.findById(word.jmdict_id));
            if (word.start && word.end)
              play({ start: word.start, end: word.end });
          }}
          onMouseLeave={handlePopoverClose}
        >
          <span
            style={{
              color: word.partOfSpeech ? posColors[word.partOfSpeech] : "",
              // textShadow: "0 0 1px #555",
              textShadow: playingWordIdx === i ? "0 0 2px #555" : "",
            }}
          >
            {word.reading ? (
              <Furigana
                word={word.word}
                reading={word.reading}
                textStyle={{ fontSize: breakpoint === "xs" ? "16px" : "24px" }}
                showFuri={showFuri}
              />
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
      <Popover
        id="jmdict-popover"
        sx={{ pointerEvents: "none", top: 25 }}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        disableRestoreFocus
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {jmdictWord ? (
          // @ts-expect-error: TODO, missing metadata
          <DictionaryEntry entry={jmdictWord} />
        ) : (
          "Loading..."
        )}
      </Popover>
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
              color: word.partOfSpeech ? posColors[word.partOfSpeech] : "",
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
                color: word?.partOfSpeech ? posColors[word.partOfSpeech] : "",
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
  eventDone?: (event: string) => void,
  breakpoint?: string,
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
  const startEndRef = React.useRef({ start, end });

  // Can't play until user has interacted.
  const userInteractionRef = React.useRef(false);

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
      // console.log("currentTime", currentTime);

      // Alternatively via setTimeout; each has pros/cons on different devices :(
      if (currentTime >= startEndRef.current.end) {
        audio.pause();
        setIsPlaying(false);
        setPlayingWordIdx(-1);
        if (avatarRef?.current) avatarRef.current.style.boxShadow = "";
        if (eventDone) eventDone("play");
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
    [
      audioRef,
      words,
      setPlayingWordIdx,
      setIsPlaying,
      avatarRef,
      startEndRef,
      eventDone,
    ],
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

  const play = React.useCallback(
    (range?: { start: number; end: number }) => {
      const audio = audioRef.current;
      if (!audio) return;

      // We should probably have an explicit API to set this.
      if (!range) userInteractionRef.current = true;
      // Except now we onClick instead of onMouseOver, so we don't need this.
      // if (!userInteractionRef.current) return;
      // console.log(range);

      startEndRef.current = range || { start, end };

      /*
      // This maybe works much better than relying on `timeupdate`.
      function timedStop() {
        setTimeout(
          () => {
            audio?.pause();
            audio?.removeEventListener("play", timedStop);
            setIsPlaying(false);
            setPlayingWordIdx(-1);
            if (avatarRef?.current) avatarRef.current.style.boxShadow = "";
          },
          (startEndRef.current.end - startEndRef.current.start) * 1000,
        );
      }
      audio.addEventListener("play", timedStop);
      */

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
          const multiplier = breakpoint === "xs" ? 4 : 8;
          avatar.style.boxShadow =
            "0px 0px 0px " + multiplier * v + "px rgba(100,100,100,0.3)";
        }

        requestAnimationFrame(render);
      }
      if (!actxRef.current) audio.addEventListener("canplay", setup);
      // --- wave scope end ---

      audio.currentTime = startEndRef.current.start;
      // console.log("set currentTime to ", startEndRef.current.start);
      setIsPlaying(true);
      audio.play();
    },
    [audioRef, start, setIsPlaying, avatarRef, end, breakpoint],
  );

  return { isPlaying, play, playingWordIdx };
}

export default React.memo(function TextBlock({
  text,
  words,
  speakers,
  speakerId,
  audio,
  translations,
  status,
  lessonAudio,
  event,
  eventDone,
  style,
  showFuri = true,
  showRomaji = true,
  showTranslation = true,
}: {
  text: string;
  words: Word[];
  speakers: Speaker[];
  speakerId: number;
  audio: Lesson["blocks"][0]["audio"];
  translations: BlockTranslations;
  status?: { title: string; showProgress: boolean; message?: string };
  lessonAudio?: Lesson["audio"];
  event?: string;
  eventDone?: (event: string) => void;
  style?: React.CSSProperties;
  showFuri?: boolean;
  showRomaji?: boolean;
  showTranslation?: boolean;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);
  // const [done, setDone] = React.useState(false);
  const breakpoint = useBreakPoint();

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
    // typeof words?.[0]?.start === "number" ? words[0].start : audio.start,
    audio.start || words?.[0]?.start || 0,
    // typeof lastWord?.end === "number" ? lastWord.end : audio.end,
    audio.end || lastWord.end || 0,
    avatarRef,
    event === "play" ? eventDone : undefined,
    breakpoint,
  );
  // console.log({ results });
  const audioSrc =
    audio.src ||
    (lessonAudio && "/api/file2?sha256=" + lessonAudio.sha256) ||
    "";

  React.useEffect(() => {
    // if (event) console.log("event", event);
    if (event === "play") play();
    if (event)
      avatarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [event, play]);

  const isCurrent = event && event !== "delay";

  return (
    <div style={style}>
      <audio ref={audioRef} src={audioSrc} preload="auto" />

      <Stack direction="row" spacing={breakpoint === "xs" ? 1 : 2}>
        <div>
          <div
            ref={avatarRef}
            onClick={() => play()}
            style={{
              boxSizing: "content-box",
              height: breakpoint === "xs" ? 28 : 70,
              width: breakpoint === "xs" ? 28 : 70,
              borderRadius: "50%",
              border: isCurrent ? "2px solid blue" : "1px solid black",
              margin: isCurrent ? 0 : 1,
              scrollMarginTop: 200,
              position: "relative",
              // top: 9, // breakpoint === "xs" ? 9 : 9,
            }}
          >
            {speaker.url ? (
              <Image
                alt={speaker.name || "Speaker Avatar"}
                src={speaker.url}
                width={breakpoint === "xs" ? 28 : 70}
                height={breakpoint === "xs" ? 28 : 70}
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

        <div
          style={{
            position: "relative",
          }}
        >
          <Tail />

          <div
            style={{
              background: "white",
              borderTopLeftRadius: "none",
              borderTopRightRadius: "7.5px",
              borderBottomLeftRadius: "7.5px",
              borderBottomRightRadius: "7.5px",
              boxShadow: "0 1px 0.5px rgba(0,0,0,.13)",
              padding: "5px 10px 5px 10px",
            }}
          >
            {words.length ? (
              <>
                <LayoutWords
                  words={words}
                  playingWordIdx={playingWordIdx}
                  play={play}
                  breakpoint={breakpoint}
                  showFuri={showFuri}
                />
                <div style={{ opacity: 0.65 }}>
                  {showRomaji && (
                    <LayoutHepburn
                      words={words}
                      playingWordIdx={playingWordIdx}
                    />
                  )}
                  {translations && showTranslation ? (
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
          </div>
        </div>
      </Stack>
    </div>
  );
});
