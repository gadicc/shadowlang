import React from "react";
import * as Tone from "tone";

function play(
  synth: Tone.Synth<Tone.SynthOptions>,
  tune: "listen" | "correct" | "incorrect",
) {
  console.log("play", tune);
  const now = Tone.now();
  switch (tune) {
    case "listen":
      synth.triggerAttackRelease("C4", "8n", now);
      break;
    case "correct":
      synth.triggerAttackRelease("C4", "8n", now);
      synth.triggerAttackRelease("E4", "8n", now + 0.5);
      break;
    case "incorrect":
      synth.triggerAttackRelease("C4", "8n", now);
      synth.triggerAttackRelease("G4", "8n", now + 0.5);
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
  console.log({ result });

  React.useEffect(() => {
    console.log("a");
    if (isCurrent) {
      if (speechRecognition) {
        speechRecognition.start();
        // play(synthRef.current!, "listen");
      }
    }
  }, [isCurrent, speechRecognition]);

  const finish = React.useCallback(
    function () {
      console.log("finish - is done?");
      if (done) return;
      console.log("run once");
      setDone(true);
      setIdx(idx + 1);
    },
    [done, idx, setIdx],
  );

  React.useEffect(() => {
    console.log("b");
    if (isFinal) finish();
  }, [isFinal, finish]);

  return (
    <div>
      <div>current: {isCurrent.toString()}</div>
      <div>text: {text}</div>
      <div>result: {result}</div>
      <div>final: {isFinal.toString()}</div>
      <div>correct: {(text === result).toString()}</div>
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
          console.log(1);
          await Tone.start();
          console.log(2);
          const synth = new Tone.Synth().toDestination();
          synthRef.current = synth;
          setIdx(0);
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
