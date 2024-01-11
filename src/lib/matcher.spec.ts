import { describe, it, expect } from "@jest/globals";
import Matcher from "./matcher";

describe("matcher", () => {
  // const targetWords = ["初めまして", "私", "は", "アンミン", "です"];
  const targetWords = [
    {
      word: "初めまして",
      start: 0.5,
      end: 1.5,
      punctuation: "。",
    },
    {
      word: "私",
      start: 1.5,
      end: 2,
      grammar: "pronoun",
      role: "topic",
    },
    {
      word: "は",
      start: 1.5,
      end: 2,
      grammar: "particle",
      role: "topic-marker",
    },
    {
      word: "アンミン",
      start: 2,
      end: 3.5,
      punctuation: "です",
      alsoAccept: ["あみん"],
    },
    {
      word: "です",
      start: 3.5,
      end: 3.5,
      grammar: "copula",
      punctuation: "。",
    },
  ];

  it("should match", () => {
    const matcher = new Matcher(targetWords);

    // 1
    matcher.match({
      0: {
        0: { transcript: "初", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 1,
    });
    expect(matcher.words.every((word) => !word.matched)).toBe(true);
    expect(matcher.words[0].partial).toBe("初");

    // 2
    matcher.match({
      0: {
        0: { transcript: "初め", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 1,
    });
    expect(matcher.words.every((word) => !word.matched)).toBe(true);
    expect(matcher.words[0].partial).toBe("初め");

    // 3
    matcher.match({
      0: {
        0: { transcript: "初めまして", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 1,
    });
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: false },
      { word: "は", matched: false },
      { word: "アンミン", matched: false },
      { word: "です", matched: false },
    ]);

    // 4
    matcher.match({
      0: {
        0: { transcript: "初めまして", confidence: 0.8999999761581421 },
        isFinal: false,
        length: 1,
      },
      1: {
        0: { transcript: " 私", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 2,
    });
    // i.e. no changes
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: true },
      { word: "は", matched: false },
      { word: "アンミン", matched: false },
      { word: "です", matched: false },
    ]);

    // 5
    matcher.match({
      0: {
        0: { transcript: "初めまして私は", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 1,
    });
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: true },
      { word: "は", matched: true },
      { word: "アンミン", matched: false },
      { word: "です", matched: false },
    ]);

    // 6
    matcher.match({
      0: {
        0: { transcript: "初めまして", confidence: 0.8999999761581421 },
        isFinal: false,
        length: 1,
      },
      1: {
        0: { transcript: " 私はア", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 2,
    });
    // i.e. no change
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: true },
      { word: "は", matched: true },
      { word: "アンミン", matched: false },
      { word: "です", matched: false },
    ]);

    // 7
    matcher.match({
      0: {
        0: { transcript: "初めまして私は", confidence: 0.8999999761581421 },
        isFinal: false,
        length: 1,
      },
      1: {
        0: { transcript: " あみ", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 2,
    });
    // i.e. no change
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: true },
      { word: "は", matched: true },
      { word: "アンミン", matched: false },
      { word: "です", matched: false },
    ]);

    // 8
    matcher.match({
      0: {
        0: { transcript: "初めまして私は", confidence: 0.8999999761581421 },
        isFinal: false,
        length: 1,
      },
      1: {
        0: { transcript: " あみん", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 2,
    });
    // alternative match
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: true },
      { word: "は", matched: true },
      { word: "アンミン", matched: true },
      { word: "です", matched: false },
    ]);

    // 9
    matcher.match({
      0: {
        0: { transcript: "初めまして私は", confidence: 0.8999999761581421 },
        isFinal: false,
        length: 1,
      },
      1: {
        0: { transcript: " あみんです", confidence: 0.009999999776482582 },
        isFinal: false,
        length: 1,
      },
      length: 2,
    });
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: true },
      { word: "は", matched: true },
      { word: "アンミン", matched: true },
      { word: "です", matched: true },
    ]);

    // 10
    matcher.match({
      0: {
        0: {
          transcript: "初めまして私は あみんです",
          confidence: 0.9179695844650269,
        },
        1: { transcript: "初めまして 私はアミンです", confidence: 0 },
        2: { transcript: "初めまして 私はアミング です", confidence: 0 },
        isFinal: true,
        length: 3,
      },
      length: 1,
    });
    // i.e. no change
    expect(matcher.words).toMatchObject([
      { word: "初めまして", matched: true },
      { word: "私", matched: true },
      { word: "は", matched: true },
      { word: "アンミン", matched: true },
      { word: "です", matched: true },
    ]);
  });
});
