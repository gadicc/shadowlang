import { describe, expect, test as it } from "@jest/globals";
import matchTimestamps from "@/app/lesson/edit/matchTimestamps";

import fullLesson from "@/assets/op-jp-ab-1.json";
import fullTranscript from "@/app/api/transcribe/1absolutebeginner_lesson1.json";

function partial(start: number, end: number) {
  return {
    lesson: {
      ...fullLesson,
      blocks: fullLesson.blocks.slice(start, end),
    },
    transcript: {
      ...fullTranscript,
      segments: fullTranscript.segments.slice(start, end),
    },
  };
}

describe("matchTimestamps", () => {
  it("初めまして。 私はアンミンです。", () => {
    const { lesson, transcript } = partial(0, 1);

    const result = matchTimestamps(transcript, lesson);
    expect(result.blocks[0].words).toMatchObject([
      expect.objectContaining({ word: "初めまして", start: 0.43, end: 1.49 }),
      expect.objectContaining({ word: "私", start: 1.59, end: 2.07 }),
      expect.objectContaining({ word: "は", start: 2.07, end: 2.47 }),
      expect.objectContaining({ word: "アンミン", start: 2.47, end: 2.97 }),
      expect.objectContaining({ word: "です", start: 2.97, end: 3.19 }),
    ]);
  });

  it("私 はトミです。よろしくお 願 いします。 | こちらこそ、よろしくお 願 いします。", () => {
    const { lesson, transcript } = partial(1, 3);

    const result = matchTimestamps(transcript, lesson);

    expect(result.blocks[0].words).toMatchObject([
      expect.objectContaining({ word: "私", start: 3.83, end: 4.31 }),
      expect.objectContaining({ word: "は", start: 4.31, end: 4.57 }),
      expect.objectContaining({ word: "トミー", start: 4.57, end: 4.79 }),
      expect.objectContaining({ word: "です", start: 4.79, end: 5.09 }),
      expect.objectContaining({
        word: "よろしくお願いします",
        start: 5.31,
        end: 6.29,
      }),
    ]);

    expect(result.blocks[1].words).toMatchObject([
      expect.objectContaining({ word: "こちらこそ", start: 6.83, end: 7.75 }),
      expect.objectContaining({
        word: "よろしくお願いします",
        start: 7.75,
        end: 8.99,
      }),
    ]);
  });
});
