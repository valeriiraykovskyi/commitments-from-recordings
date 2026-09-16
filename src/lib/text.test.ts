import { describe, expect, it } from "vitest";

import { tokenize } from "@/lib/text";

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
