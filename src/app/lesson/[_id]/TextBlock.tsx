"use client";
import React from "react";
import hepburn from "hepburn";
import Image from "next/image";

import { LinearProgress, Popover, Stack } from "@mui/material";

// import useAudio from "./useAudioHowler";
import useAudio from "./useAudioElement";

import { BlockTranslations, Speaker } from "../edit/types";
import { JMdictWord, type Speaker as DBSpeaker, type Lesson } from "@/schemas";
import posColors from "@/lib/pos-colors";
import { DictionaryEntry } from "../edit/useJmDictModal";
import { jmdict } from "@/dicts";
import useBreakPoint from "@/lib/useBreakPoint";
import Furigana from "@/lib/furigana";
import Tail from "@/lib/tail";
import { globalSpeechRecognizer } from "@/lib/speechRecognizer";
import Matcher from "@/lib/matcher";
import { playTone } from "./tones";

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

export interface Word {
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
  prevEvent,
  style,
  showFuri = true,
  showRomaji = true,
  showTranslation = true,
  playbackRate = 1,
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
  prevEvent?: string;
  style?: React.CSSProperties;
  showFuri?: boolean;
  showRomaji?: boolean;
  showTranslation?: boolean;
  playbackRate?: number;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const avatarRef = React.useRef<HTMLDivElement>(null);
  // const [done, setDone] = React.useState(false);
  const breakpoint = useBreakPoint();

  const speaker = speakers[speakerId];
  if (!speaker.url && !speaker.initials)
    speaker.initials = String.fromCharCode(65 + speakerId);

  // const isCorrect = false;
  const [isListening, setIsListening] = React.useState(false);
  const translation = translations?.en;

  const lastIndex = words.findLastIndex(
    (word) => word.partOfSpeech !== "symbol",
  );
  const lastWord = words[lastIndex !== -1 ? lastIndex : words.length - 1];

  const audioSrc =
    audio.src ||
    (lessonAudio && "/api/file2?sha256=" + lessonAudio.sha256) ||
    "";
  const { isPlaying, play, playingWordIdx } = useAudio(
    // audioSrc, // <-- useAudioHowler
    audioRef, // <-- useAudioElement
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

  const matcher = React.useMemo(
    () => new Matcher(words.filter((w) => w.partOfSpeech !== "symbol")),
    [words],
  );
  const [srResults, setSrResults] =
    React.useState<SpeechRecognitionResultList | null>(null);

  const srResultsText = React.useMemo(() => {
    if (!srResults) return "";
    return Array.from(srResults)
      .map((result) => result[0].transcript)
      .join(" ");
  }, [srResults]);

  const matchedWords = React.useMemo(
    () => (srResults ? matcher.match(srResults) : []),
    [matcher, srResults],
  );
  // React.useEffect(() => console.log(matchedWords), [matchedWords]);

  const matchedWordsMarkup = React.useMemo(
    () =>
      matchedWords.map((word, i) => (
        <span key={i} style={{ color: word.matched ? "green" : "" }}>
          {word.word}
        </span>
      )),
    [matchedWords],
  );
  const allWordsMatched = React.useMemo(
    () => matchedWords.every((w) => w.matched),
    [matchedWords],
  );

  if (audioRef.current) audioRef.current.playbackRate = playbackRate;

  React.useEffect(() => {
    if (allWordsMatched) globalSpeechRecognizer.speechRecognition.abort();
  }, [allWordsMatched]);

  const onEndRef = React.useRef(false);
  React.useEffect(() => {
    if (onEndRef.current === false) return;
    onEndRef.current = false;

    if (prevEvent === "listen") {
      if (allWordsMatched) {
        playTone("correct");
      } else {
        playTone("incorrect");
      }
    }
  }, [prevEvent, allWordsMatched, onEndRef]);

  React.useEffect(() => {
    // if (event) console.log("event", event);
    if (event === "play") play();
    if (event)
      avatarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [event, play]);

  React.useEffect(() => {
    const sr = globalSpeechRecognizer.speechRecognition;
    function onResult(event: SpeechRecognitionEvent) {
      const results = event.results;
      setSrResults(results);
      console.log(results);
    }
    function onEnd() {
      setIsListening(false);
      eventDone?.("listen");
      onEndRef.current = true;
    }

    if (event === "listen") {
      playTone("listen");
      sr.addEventListener("result", onResult);
      sr.addEventListener("end", onEnd);
      sr.start();
      setIsListening(true);
    }
    if (prevEvent === "listen") {
      setIsListening(false);
      sr.removeEventListener("result", onResult);
      sr.removeEventListener("end", onEnd);
      sr.stop();
      sr.abort();
    }
    return () => {
      setIsListening(false);
      sr.removeEventListener("result", onResult);
      sr.removeEventListener("end", onEnd);
      sr.stop();
      sr.abort();
    };
  }, [event, prevEvent, eventDone]);

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

              // 1px border can be calculated as 0.887 so this doesn't work:
              // border: isCurrent ? "2px solid blue" : "1px solid black",
              // margin: isCurrent ? 0 : 1,
              border: "1px solid black",
              outline: isCurrent ? "1px solid blue" : "none",

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
            {srResultsText}
            <br />
            {matchedWordsMarkup}
            {isListening ? "🎤" : ""}
            {!isListening && matchedWords.length
              ? allWordsMatched
                ? "✅"
                : "❌"
              : ""}
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
