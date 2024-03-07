"use client";

const path = "/audio/";

const files = {
  listen: "131658__bertrof__game-sound-selection.wav",
  correct: "131662__bertrof__game-sound-correct_v2.wav",
  incorrect: "351563__bertrof__game-sound-incorrect-with-delay.wav",
};

const audios = {
  listen: new Audio(path + files.listen),
  correct: new Audio(path + files.correct),
  incorrect: new Audio(path + files.incorrect),
};

export async function playTone(tune: "listen" | "correct" | "incorrect") {
  const audio = audios[tune];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play();
}
