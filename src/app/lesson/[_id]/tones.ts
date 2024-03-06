"use client";

// don't import before user interaction to avoid audiocontext warnings.
// https://github.com/Tonejs/Tone.js/issues/443
// https://github.com/Tonejs/Tone.js/issues/1102
//import * as Tone from "tone";
import type * as ToneType from "tone";

let Tone: typeof ToneType | null = null;
let synth: ToneType.Synth<ToneType.SynthOptions> | null = null;
let toneNow: ReturnType<typeof ToneType.now> | null = null; // Tone.now();

export function playTone(tune: "listen" | "correct" | "incorrect") {
  if (!(Tone && toneNow && synth)) return;
  const now = Tone.now();
  if (toneNow < now) toneNow = now;

  // console.log("playTone", tune);
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

let setupHasRun = false;
async function setup() {
  if (synth || setupHasRun) return;
  setupHasRun = true;
  document.removeEventListener("touchstart", setup);
  document.removeEventListener("touchend", setup);
  document.removeEventListener("click", setup);
  document.removeEventListener("keydown", setup);
  Tone = await import("tone");
  await Tone.start();
  synth = new Tone.Synth().toDestination();
  toneNow = Tone.now();
}

if (typeof document === "object") {
  document.addEventListener("touchstart", setup);
  document.addEventListener("touchend", setup);
  document.addEventListener("click", setup);
  document.addEventListener("keydown", setup);
}
