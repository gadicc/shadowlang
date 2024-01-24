import React from "react";
import * as Tone from "tone";
import { jmdict /* kanjidic */ } from "../dicts";
jmdict;

let toneNow = Tone.now();
function play(
  synth: Tone.Synth<Tone.SynthOptions>,
  tune: "listen" | "correct" | "incorrect",
) {
  const now = Tone.now();
  if (toneNow < now) toneNow = now;

  // console.log("play", tune);
  switch (tune) {
    case "listen":
      synth.triggerAttackRelease("D5", "16n", toneNow);
      break;
    case "correct":
      synth.triggerAttackRelease("C5", "16n", toneNow);
      synth.triggerAttackRelease("G5", "16n", (toneNow += 0.25));
      toneNow += 0.25;
      break;
    case "incorrect":
      synth.triggerAttackRelease("G5", "16n", toneNow);
      synth.triggerAttackRelease("C5", "16n", (toneNow += 0.25));
      toneNow += 0.25;
      break;
    default:
      throw new Error("unknown tune: " + tune);
      throw new Error("unknown tune: " + tune);
  }
}

function getSpeechRecognition() {
  if ("SpeechRecognition" in window) return window.SpeechRecognition;

  if ("webkitSpeechRecognition" in window)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).webkitSpeechRecognition as typeof SpeechRecognition;

  throw new Error("SpeechRecognition is not supported in this browser");
}

function useSpeechRecognition() {
  const [speechRecognition, setSpeechRecognition] =
    React.useState<SpeechRecognition | null>(null);
  const [results, setResults] =
    React.useState<SpeechRecognitionResultList | null>(null);
  const [result, setResult] = React.useState<string | null>(null);
  const [isFinal, setIsFinal] = React.useState(false);

  const onResult = React.useCallback(
    function onResult(event: SpeechRecognitionEvent) {
      const results = event.results;
      console.log("onResult", results);
      setResults(results);
      setResult(results[0][0].transcript);
      if (isFinal !== results[0].isFinal) {
        setIsFinal(results[0].isFinal);
      }
    },
    [isFinal],
  );

  React.useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    const speechRecognition = new SpeechRecognition();
    speechRecognition.interimResults = true;
    speechRecognition.maxAlternatives = 5;
    setSpeechRecognition(speechRecognition);

    if (false)
      for (const eventName of [
        "audiostart",
        "audioend",
        "end",
        "error",
        "nomatch",
        "result",
        "soundstart",
        "soundend",
        "speechstart",
        "speechend",
        "start",
      ]) {
        speechRecognition.addEventListener(
          eventName,
          console.log.bind(null, eventName),
        );
      }

    speechRecognition.addEventListener("result", onResult);
    speechRecognition.addEventListener("end", () => setIsFinal(true));

    return () => {
      if (!speechRecognition) return;
      speechRecognition.removeEventListener("result", onResult);
      speechRecognition.stop();
      speechRecognition.abort();
    };
  }, [onResult]);

  return { speechRecognition, results, result, isFinal };
}

interface Word {
  word: string;
  start: number;
  end: number;
  punctuation?: string;
  grammar?: string;
  role?: string;
  alsoAccept?: string[];
}

function LayoutWords({ words }: { words: Word[] }) {
  return (
    <div>
      {words.map((word, i) => (
        <span key={i}>
          {word.word}
          {word.punctuation}
        </span>
      ))}
    </div>
  );
}

function Text({
  text,
  words,
  avatar,
  isCurrent,
  synthRef,
  idx,
  setIdx,
  audio,
}: {
  text: string;
  words: Word[];
  avatar: string;
  isCurrent: boolean;
  synthRef: React.MutableRefObject<Tone.Synth<Tone.SynthOptions> | null>;
  idx: number;
  setIdx: React.Dispatch<React.SetStateAction<number>>;
  audio: { src: string; start: number; end: number };
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [done, setDone] = React.useState(false);
  const { speechRecognition, result, /* results, */ isFinal } =
    useSpeechRecognition();
  const isCorrect =
    text.replace(/。| /g, "") ===
    result
      ?.replace(/。| /g, "")
      .replace(/とみ/, "トミ")
      .replace(/トミー/, "トミ");
  const [isListening, setIsListening] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const hasPlayed = React.useRef(false);
  // console.log({ results });

  React.useEffect(() => {
    if (isCurrent && !hasPlayed.current) {
      if (speechRecognition) {
        speechRecognition.lang = "ja-JP";
        const audioEl = audioRef.current!;
        hasPlayed.current = true;
        audioEl.currentTime = audio.start;
        audioEl.play();
        setIsPlaying(true);
        setTimeout(
          () => {
            audioEl.pause();
            setIsPlaying(false);
            const shouldCheck = true;
            if (shouldCheck) {
              setIsListening(true);

              /* this has no effect unfortunately - known issue 
              const grammar =
                "#JSGF V1.0; grammar names; public <name> = アンミン | トミ ;";
              const speechRecognitionList = new webkitSpeechGrammarList();
              speechRecognitionList.addFromString(grammar, 1);
              speechRecognition.grammars = speechRecognitionList;
              */

              speechRecognition.start();

              play(synthRef.current!, "listen");
            } else {
              setIdx(idx + 1);
            }
          },
          (audio.end - audio.start) * 1000,
        );
      }
    }
  }, [isCurrent, speechRecognition, synthRef]);

  const finish = React.useCallback(
    function () {
      if (done) return;
      if (isCorrect) play(synthRef.current!, "correct");
      else play(synthRef.current!, "incorrect");
      setIsListening(false);
      setDone(true);
      setTimeout(() => setIdx(idx + 1), 1000);
    },
    [done, idx, setIdx, isCorrect, synthRef],
  );

  React.useEffect(() => {
    if (isFinal) finish();
  }, [isFinal, finish]);

  React.useEffect(() => {}, []);

  return (
    <div style={{ position: "relative", height: 100 }}>
      <div style={{ position: "absolute", top: 0, left: 0 }}>
        <div
          style={{
            height: 80,
            width: 80,
            borderRadius: "50%",
            border: isCurrent ? "2px solid blue" : "1px solid black",
            margin: isCurrent ? 0 : 1,
          }}
        >
          <img
            alt={avatar + " avatar"}
            src={`/img/avatars/${avatar}.png`}
            width={80}
            height={80}
          />
        </div>
      </div>

      <div style={{ position: "absolute", top: 20, left: 105 }}>
        <div style={{ color: isPlaying ? "blue" : "" }}>
          {text} {isListening ? "🎤" : ""}
        </div>
        <LayoutWords words={words} />
        <div>
          {result} {isFinal ? (isCorrect ? "✅" : "❌") : ""}
        </div>
        <br />
      </div>

      <audio ref={audioRef} src={"/audio/" + audio.src} />
    </div>
  );
}

export default function X() {
  const [idx, setIdx] = React.useState(-1);
  const texts = [
    {
      avatar: "anming",
      text: "初めまして。 私はアンミンです。",
      audio: {
        src: "1absolutebeginner_lesson1.m4a",
        start: 0.5,
        end: 3.5,
      },
      words: [
        {
          word: "初めまして",
          jmdict: "1625780",
          start: 0.5,
          end: 1.5,
          punctuation: "。",
        },
        {
          word: "私",
          start: 1.5,
          end: 2,
          grammar: "pronoun",
          role: "topic",
        },
        {
          word: "は",
          start: 1.5,
          end: 2,
          grammar: "particle",
          role: "topic-marker",
        },
        {
          word: "アンミン",
          start: 2,
          end: 3.5,
          alsoAccept: ["あみん"],
        },
        {
          word: "です",
          start: 3.5,
          end: 3.5,
          grammar: "copula",
          punctuation: "。",
        },
      ],
    },
    {
      avatar: "tommy",
      text: "私はトミです。よろしくお願いします。",
      audio: {
        src: "1absolutebeginner_lesson1.m4a",
        start: 4,
        end: 7,
      },
      words: [],
    },
  ];
  const synthRef = React.useRef<Tone.Synth<Tone.SynthOptions> | null>(null);

  return (
    <div style={{ background: "#dfdfdf", padding: "15px" }}>
      <button
        onClick={async () => {
          await Tone.start();
          const synth = new Tone.Synth().toDestination();
          synthRef.current = synth;
          setIdx(0);
          // play(synth, "incorrect");
        }}
      >
        start
      </button>
      <br />
      <br />
      {texts.map((entry, i) => (
        <Text
          key={i}
          avatar={entry.avatar}
          text={entry.text}
          words={entry.words}
          isCurrent={i === idx}
          idx={idx}
          setIdx={setIdx}
          synthRef={synthRef}
          audio={entry.audio}
        />
      ))}
    </div>
  );
}
