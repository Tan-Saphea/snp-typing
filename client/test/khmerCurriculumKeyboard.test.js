import { buildLessonTargetText } from "@snp/shared";
import { describe, expect, it } from "vitest";

import { seedLessons } from "../../server/src/seeds/lessonData.js";
import { findKeyForOutput } from "../src/features/typing/keyboardLayouts.js";

describe("published Khmer curriculum keyboard coverage", () => {
  it("can guide every target through the NIDA base, Shift, or AltGr layers", () => {
    const missing = new Set();

    for (const lesson of seedLessons.filter((item) => item.language === "km" && item.isPublished)) {
      let remaining = buildLessonTargetText(lesson);
      while (remaining) {
        const match = findKeyForOutput("km", remaining);
        if (!match.output) {
          missing.add([...remaining][0]);
          remaining = [...remaining].slice(1).join("");
        } else {
          remaining = [...remaining].slice([...match.output].length).join("");
        }
      }
    }

    expect([...missing]).toEqual([]);
  });
});
