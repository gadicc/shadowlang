import { toHiragana } from "hepburn";
import type { BlockWord, Transcription, Lesson } from "./types";

function wordsMatch(blockWord: BlockWord, candidate: string) {
  const tryWord = candidate.replace(/。/g, "");
  const word = blockWord.word.replace(/。/g, "");
  if (word === tryWord) return true;

  if (blockWord.reading) {
    const reading = blockWord.reading.replace(/。/g, "");
    if (tryWord === reading) return true;
    if (toHiragana(tryWord) === reading) return true;
  }

  return false;
}

export default function matchTimestamps(
  transcription: Transcription,
  origLesson: Partial<Lesson>,
  log = false,
): Lesson {
  const lesson = { ...origLesson };

  // lesson.blocks ~= transcription.segments
  for (let i = 0; i < transcription.segments.length; i++) {
    if (!lesson.blocks) throw new Error("lesson.blocks is undefined");
    if (lesson.blocks.length !== transcription.segments.length)
      throw new Error("lesson.blocks.length !== transcription.segments.length");

    const segment = transcription.segments[i];
    const block = lesson.blocks[i];

    let bwi = 0;
    let swiStart = 0,
      sword = "";
    for (let swi = 0; swi < segment.words.length; swi++) {
      const blockWord = block.words[bwi];
      const tryWord = sword + segment.words[swi].word;

      if (log)
        console.log(
          "blockWord",
          blockWord.word,
          blockWord.reading,
          "segTryWord",
          tryWord,
        );

      if (wordsMatch(blockWord, tryWord)) {
        lesson.blocks[i].words[bwi] = {
          ...blockWord,
          start: segment.words[swiStart].start,
          end: segment.words[swi].end,
        };

        if (log) console.log(lesson.blocks[i].words[bwi]);

        swiStart = swi + 1;
        sword = "";
        bwi++;
      } else {
        sword = tryWord;
      }
    }
  }

  return lesson;
}
