"use client";

function getSpeechRecognition() {
  if ("SpeechRecognition" in window) return window.SpeechRecognition;

  if ("webkitSpeechRecognition" in window)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).webkitSpeechRecognition as typeof SpeechRecognition;

  throw new Error("SpeechRecognition is not supported in this browser");
}

export class SpeechRecognizer {
  speechRecognition: SpeechRecognition;
  timeout: number;
  timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  constructor({
    continuous = true,
    lang = "ja-JP",
    interimResults = true,
    maxAlternatives = 5,
    timeout = 3000,
  }: {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    timeout?: number;
  }) {
    this.timeout = timeout;

    // Only used in nextjs prebuild to avoid ReferenceError
    if (typeof window === "undefined") {
      // @ts-expect-error: ok
      this.speechRecognition = null;
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    const speechRecognition = new SpeechRecognition();
    this.speechRecognition = speechRecognition;

    speechRecognition.continuous = continuous;
    speechRecognition.interimResults = interimResults;
    speechRecognition.lang = lang;
    speechRecognition.maxAlternatives = maxAlternatives;

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

    speechRecognition.addEventListener("start", this.setTimeout.bind(this));
    speechRecognition.addEventListener("result", this.setTimeout.bind(this));

    speechRecognition.addEventListener("end", this.clearTimeout.bind(this));
  }

  clearTimeout() {
    if (this.timeoutHandle) clearTimeout(this.timeoutHandle);
  }
  setTimeout() {
    this.clearTimeout();
    this.timeoutHandle = setTimeout(() => {
      this.speechRecognition.abort();
      this.speechRecognition.stop();
    }, this.timeout);
  }
}

export const globalSpeechRecognizer = new SpeechRecognizer({
  continuous: true,
  lang: "ja-JP",
  interimResults: true,
  maxAlternatives: 5,
});
