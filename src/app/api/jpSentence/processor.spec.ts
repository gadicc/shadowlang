import { describe, test as it, expect, afterAll } from "@jest/globals";
import processor, { db, getLastWord } from "./processor";

describe("process", () => {
  afterAll(async () => {
    await db.dbPromise;
    await db.client.close();
  });

  describe("getLastWord", () => {
    it("そうなんですか", () => {
      const morphemes = [
        { surface_form: "そうなん" },
        { surface_form: "ですか" },
      ];
      // @ts-expect-error: stub
      const result = getLastWord(morphemes);
      expect(result).toMatchObject({
        word: "そうなんですか",
        matches: ["2425480"],
        numMorphenes: 2,
      });
    });

    it("私はアンミン", () => {
      const morphemes = [
        { surface_form: "私" },
        { surface_form: "は" },
        { surface_form: "アンミン" },
      ];
      // @ts-expect-error: stub
      const result = getLastWord(morphemes);
      expect(result).toMatchObject({
        word: "アンミン",
        matches: [],
        numMorphenes: 1,
      });
    });
  });

  describe("words", () => {
    const proc = (sentence: string) => processor(sentence, "words");

    it("初めまして", async () => {
      return expect(await proc("初めまして")).toMatchObject([
        {
          word: "初めまして",
          matches: [{ id: "1625780" }],
          morpheme: undefined,
        },
      ]);
    });

    it("覗き込んでいる", async () => {
      return expect(await proc("覗き込んでいる")).toMatchObject([
        {
          word: "覗き込んでいる", // matches dictionary "覗き込む",
          matches: [{ id: "1470830" }],
          morpheme: undefined,
        },
      ]);
    });

    it("聞かれました", async () => {
      return expect(await proc("聞かれました")).toMatchObject([
        {
          word: "聞かれました",
          matches: [{ id: "1591110" }],
          morpheme: undefined,
        },
      ]);
    });

    it("初めまして。私はアンミンです。", async () => {
      return expect(await proc("初めまして。私はアンミンです。")).toMatchObject(
        [
          {
            word: "初めまして",
            matches: [{ id: "1625780" }],
            morpheme: undefined,
          },
          {
            word: "。",
            matches: [],
            morpheme: {
              pos: "記号",
            },
          },
          {
            word: "私",
            // matches: [{ id: "1591110" }], lots
            morpheme: { basic_form: "私" },
          },
          {
            word: "は",
            // matches: [{ id: "1591110" }], lots
            morpheme: { basic_form: "は" },
          },
          {
            word: "アンミン",
            matches: [],
            morpheme: { verbose: { word_type: "UNKNOWN" } },
          },
          {
            word: "です",
            // matches: [{ id: "1591110" }],
            morpheme: { basic_form: "です" },
          },
          {
            word: "。",
            matches: [],
            morpheme: {
              pos: "記号",
            },
          },
        ],
      );
    });
  });

  describe("everything", () => {
    const proc = (sentence: string) => processor(sentence);

    it("私はアンミンです。", async () => {
      return expect(await proc("私はアンミンです。")).toMatchObject([
        {
          word: "私",
          // matches: [{ id: "1591110" }], lots
          morpheme: { basic_form: "私" },
        },
        {
          word: "は",
          // matches: [{ id: "1591110" }], lots
          morpheme: { basic_form: "は" },
        },
        {
          word: "アンミン",
          matches: [],
          morpheme: { verbose: { word_type: "UNKNOWN" } },
        },
        {
          word: "です",
          // matches: [{ id: "1591110" }],
          morpheme: { basic_form: "です" },
        },
        {
          word: "。",
          matches: [],
          morpheme: {
            pos: "記号",
          },
        },
      ]);
    });
  });
});
