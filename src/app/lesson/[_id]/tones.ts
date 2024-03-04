"use client";
import * as Tone from "tone";

let synth: Tone.Synth<Tone.SynthOptions> | null = null;
let toneNow = Tone.now();

export function playTone(tune: "listen" | "correct" | "incorrect") {
  if (!synth) return;
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

async function setup() {
  if (synth) return;
  window.removeEventListener("touchstart", setup);
  window.removeEventListener("click", setup);
  await Tone.start();
  synth = new Tone.Synth().toDestination();
}

if (typeof window === "object") {
  window.addEventListener("touchstart", setup);
  window.addEventListener("click", setup);
}
