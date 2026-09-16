import { describe, expect, it } from "vitest";

import { containsPhrase, findTokenRuns, tokenize } from "@/lib/text";

describe("tokenize", () => {
  it.each([
    ["Hi, I'm Anna!", ["hi", "im", "anna"]],
    ["the sign-up bug", ["the", "sign", "up", "bug"]],
    ["It’s done — by 5 PM", ["its", "done", "by", "5", "pm"]],
    ["Hola, soy Lucía.", ["hola", "soy", "lucia"]],
    ["  ", []],
  ])("tokenizes %j", (text, expected) => {
    expect(tokenize(text)).toEqual(expected);
  });
});

describe("findTokenRuns", () => {
  it("finds every contiguous occurrence", () => {
    expect(findTokenRuns(["a", "b", "a", "b"], ["a", "b"])).toEqual([0, 2]);
  });

  it("ignores gaps and empty needles", () => {
    expect(findTokenRuns(["a", "x", "b"], ["a", "b"])).toEqual([]);
    expect(findTokenRuns(["a"], [])).toEqual([]);
  });
});

describe("containsPhrase", () => {
  it("matches whole words regardless of case and punctuation", () => {
    expect(containsPhrase("Sure. I'll have it done by Wednesday.", "by wednesday")).toBe(true);
    expect(containsPhrase("Let's say Monday instead.", "Monday")).toBe(true);
  });

  it("does not match parts of words or reordered words", () => {
    expect(containsPhrase("Mondays are busy", "Monday")).toBe(false);
    expect(containsPhrase("by Wednesday", "Wednesday by")).toBe(false);
  });
});
