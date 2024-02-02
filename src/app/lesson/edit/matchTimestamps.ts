import { toHiragana } from "hepburn";
import type { BlockWord, Transcription, Lesson } from "./types";

function wordsMatch(blockWord: BlockWord, candidate: string) {
  if (!(blockWord && blockWord.word)) return false;
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

function matchTimestampBlock(
  segment: Transcription["segments"][0],
  block: Lesson["blocks"][0],
  log = false,
) {
  const newBlock = { ...block };

  let bwi = 0;
  let swiStart = 0,
    sword = "";
  for (let swi = 0; swi < segment.words.length; swi++) {
    // Skip punctuation, etc.
    while (
      bwi < block.words.length &&
      block.words[bwi].partOfSpeech === "symbol"
    )
      bwi++;

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
      newBlock.words[bwi] = {
        ...blockWord,
        start: segment.words[swiStart].start,
        end: segment.words[swi].end,
      };

      if (log) console.log(newBlock.words[bwi]);

      swiStart = swi + 1;
      sword = "";
      bwi++;
    } else {
      sword = tryWord;
    }
  }

  return newBlock;
}

export default function matchTimestamps(
  transcription: Transcription,
  origLesson: Lesson,
  i?: number,
  log = false,
): Lesson {
  const lesson = { ...origLesson };
  if (!lesson.blocks) throw new Error("lesson.blocks is undefined");
  if (lesson.blocks.length !== transcription.segments.length)
    throw new Error("lesson.blocks.length !== transcription.segments.length");

  // lesson.blocks ~= transcription.segments

  if (typeof i === "number") {
    const segment = transcription.segments[i];
    const block = lesson.blocks[i];
    lesson.blocks[i] = matchTimestampBlock(segment, block, log);
    return lesson;
  }

  for (let i = 0; i < transcription.segments.length; i++) {
    const segment = transcription.segments[i];
    const block = lesson.blocks[i];
    lesson.blocks[i] = matchTimestampBlock(segment, block, log);
  }

  return lesson;
}
