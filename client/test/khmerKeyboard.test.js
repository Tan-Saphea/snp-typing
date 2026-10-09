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

  it("maps Khmer NIDA space to the Space key", () => {
    expect(findKeyForOutput("km", " ")).toEqual({ altGr: false, code: "Space", shifted: true, output: " " });
    expect(findKeyForOutput("km", "\u200B")).toEqual({ altGr: false, code: "Space", shifted: false, output: "\u200B" });
  });

  it("maps English base, shifted, and punctuation outputs correctly", () => {
    expect(getKeyboardOutput("en", "KeyA", false)).toBe("a");
    expect(getKeyboardOutput("en", "KeyA", true)).toBe("A");
    expect(getKeyboardOutput("en", "Digit1", true)).toBe("!");
    expect(getKeyboardOutput("en", "Space", false)).toBe(" ");
    expect(getKeyboardOutput("en", "Comma", false)).toBe(",");
  });

  it("produces full Khmer syllable clusters via sequential virtual key outputs", () => {
    // Word "ខ្ញុំ" (I / me in Khmer):
    // KeyX unshifted -> 'ខ'
    const step1 = getKeyboardOutput("km", "KeyX", false);
    expect(step1).toBe("ខ");

    // KeyJ unshifted -> coeng '្'
    const step2 = getKeyboardOutput("km", "KeyJ", false);
    expect(step2).toBe("្");

    // KeyJ shifted -> 'ញ'
    const step3 = getKeyboardOutput("km", "KeyJ", true);
    expect(step3).toBe("ញ");

    // KeyU unshifted -> vowel 'ុ'
    const step4 = getKeyboardOutput("km", "KeyU", false);
    expect(step4).toBe("ុ");

    // KeyM shifted -> nikkahit 'ំ'
    const step5 = getKeyboardOutput("km", "KeyM", true);
    expect(step5).toBe("ំ");

    const fullWord = `${step1}${step2}${step3}${step4}${step5}`.normalize("NFC");
    expect(fullWord).toBe("ខ្ញុំ");
  });
});
