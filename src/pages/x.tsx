import React from "react";
import * as Tone from "tone";

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
  }
}

function getSpeechRecognition() {
  if ("SpeechRecognition" in window) return window.SpeechRecognition;

  if ("webkitSpeechRecognition" in window)
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
      console.log("onResult", event.results);
      const results = event.results;
      setResults(results);
      console.log(results);
      setResult(results[0][0].transcript);
      if (isFinal !== results[0].isFinal) {
        setIsFinal(results[0].isFinal);
        console.log("setIsFinal", results[0].isFinal);
      }
      console.log(results[0], results[0].isFinal);
    },
    [isFinal],
  );

  React.useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    const speechRecognition = new SpeechRecognition();
    speechRecognition.interimResults = true;
    setSpeechRecognition(speechRecognition);

    if (true)
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

function Text({
  text,
  isCurrent,
  synthRef,
  idx,
  setIdx,
}: {
  text: string;
  isCurrent: boolean;
  synthRef: React.MutableRefObject<Tone.Synth<Tone.SynthOptions> | null>;
  idx: number;
  setIdx: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [done, setDone] = React.useState(false);
  const { speechRecognition, result, isFinal } = useSpeechRecognition();
  const isCorrect = text === result;
  // console.log({ result });

  React.useEffect(() => {
    if (isCurrent) {
      if (speechRecognition) {
        speechRecognition.start();
        play(synthRef.current!, "listen");
      }
    }
  }, [isCurrent, speechRecognition, synthRef]);

  const finish = React.useCallback(
    function () {
      if (done) return;
      if (isCorrect) play(synthRef.current!, "correct");
      else play(synthRef.current!, "incorrect");
      setDone(true);
      setIdx(idx + 1);
    },
    [done, idx, setIdx, isCorrect, synthRef],
  );

  React.useEffect(() => {
    if (isFinal) finish();
  }, [isFinal, finish]);

  React.useEffect(() => {}, []);

  return (
    <div
      style={{
        borderLeft: isCurrent ? "2px solid blue" : "none",
        paddingLeft: isCurrent ? "5px" : "7px",
      }}
    >
      <div>
        text: {text} {isCurrent && !isFinal ? "🎤" : ""}
      </div>
      <div>
        result: {result} {isFinal ? (isCorrect ? "✅" : "❌") : ""}
      </div>
      <br />
    </div>
  );
}

export default function X() {
  const [idx, setIdx] = React.useState(-1);
  const texts = ["hello how are you", "fine thanks and you"];
  const synthRef = React.useRef<Tone.Synth<Tone.SynthOptions> | null>(null);

  return (
    <div>
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
      {texts.map((text, i) => (
        <Text
          key={i}
          text={text}
          isCurrent={i === idx}
          idx={idx}
          setIdx={setIdx}
          synthRef={synthRef}
        />
      ))}
    </div>
  );
}
