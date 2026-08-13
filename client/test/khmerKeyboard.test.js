import { describe, expect, it } from "vitest";

import { findKeyForOutput, getKeyboardOutput } from "../src/features/typing/keyboardLayouts.js";

describe("Khmer NIDA virtual keyboard", () => {
  it("maps Khmer base and shifted consonants", () => {
    expect(getKeyboardOutput("km", "KeyK")).toBe("ក");
    expect(getKeyboardOutput("km", "KeyK", true)).toBe("គ");
    expect(findKeyForOutput("km", "គ")).toEqual({ altGr: false, code: "KeyK", shifted: true, output: "គ" });
  });

  it("maps dependent signs and Khmer punctuation", () => {
    expect(findKeyForOutput("km", "្")).toEqual({ altGr: false, code: "KeyJ", shifted: false, output: "្" });
    expect(findKeyForOutput("km", "។")).toEqual({ altGr: false, code: "Period", shifted: false, output: "។" });
  });

  it("keeps English shift mapping available", () => {
    expect(findKeyForOutput("en", "G")).toEqual({ altGr: false, code: "KeyG", shifted: true, output: "G" });
  });

  it("prefers a whole Khmer NIDA sequence over separate combining keys", () => {
    expect(findKeyForOutput("km", "ាំង")).toEqual({ altGr: false, code: "KeyA", shifted: true, output: "ាំ" });
    expect(findKeyForOutput("km", "ុំ។")).toEqual({ altGr: false, code: "Comma", shifted: false, output: "ុំ" });
    expect(findKeyForOutput("km", "ោះ ")).toEqual({ altGr: false, code: "Semicolon", shifted: true, output: "ោះ" });
  });

  it("maps Khmer NIDA AltGr characters used by the curriculum", () => {
    expect(findKeyForOutput("km", "ៈ")).toEqual({ altGr: true, code: "Quote", shifted: false, output: "ៈ" });
    expect(findKeyForOutput("km", "ឱ្យ")).toEqual({ altGr: true, code: "KeyO", shifted: false, output: "ឱ" });
  });
});
