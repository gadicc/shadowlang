"use client";

const path = "/audio/";

const files = {
  listen: "131658__bertrof__game-sound-selection.wav",
  correct: "131662__bertrof__game-sound-correct_v2.wav",
  incorrect: "351563__bertrof__game-sound-incorrect-with-delay.wav",
};

const audios = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [
    key,
    typeof Audio === "function" && new Audio(path + file),
  ]),
);

// Workaround for Chrome Mobile, where audio is paused when SpeechRecognition starts.
// https://stackoverflow.com/questions/77014256/android-why-does-the-video-abruptly-pause-when-starting-web-speech-recognition
if (audios.listen)
  audios.listen.addEventListener("pause", function () {
    if (this.currentTime < this.duration) this.play();
  });

export async function playTone(tune: "listen" | "correct" | "incorrect") {
  const audio = audios[tune];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play();
}
