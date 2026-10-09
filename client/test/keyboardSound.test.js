import { describe, expect, it } from "vitest";

import {
  getPanForKey,
  playKeyboardSound,
  previewKeyboardSound,
  soundProfiles,
} from "../src/features/typing/keyboardSound.js";

describe("Keyboard Sound Engine & Switch Profiles", () => {
  it("defines all five distinct acoustic switch profiles with valid acoustic parameters", () => {
    const expectedProfiles = ["soft", "thock", "mechanical", "typewriter", "bubble"];
    for (const profileKey of expectedProfiles) {
      const profile = soundProfiles[profileKey];
      expect(profile).toBeDefined();
      expect(profile.name).toBeTypeOf("string");
      expect(profile.clickFrequency).toBeGreaterThan(0);
      expect(profile.clickGain).toBeGreaterThan(0);
      expect(profile.clickDuration).toBeGreaterThan(0);
      expect(profile.bodyFrequency).toBeGreaterThan(0);
      expect(profile.bodyGain).toBeGreaterThan(0);
      expect(profile.bodyDuration).toBeGreaterThan(0);
    }
  });

  it("assigns spatial stereo panning based on physical key positions across the desk", () => {
    // Left-hand keys should pan to the left
    expect(getPanForKey("KeyQ", "q")).toBeLessThan(0);
    expect(getPanForKey("KeyA", "a")).toBeLessThan(0);
    expect(getPanForKey("Tab", "Tab")).toBeLessThan(0);
    expect(getPanForKey("ShiftLeft", "Shift")).toBeLessThan(0);

    // Center keys should be centered
    expect(getPanForKey("Space", " ")).toBe(0);
    expect(getPanForKey("KeyG", "g")).toBe(0);
    expect(getPanForKey("KeyB", "b")).toBe(0);

    // Right-hand keys should pan to the right
    expect(getPanForKey("KeyP", "p")).toBeGreaterThan(0);
    expect(getPanForKey("KeyL", "l")).toBeGreaterThan(0);
    expect(getPanForKey("Enter", "Enter")).toBeGreaterThan(0);
    expect(getPanForKey("Backspace", "Backspace")).toBeGreaterThan(0);
  });

  it("executes playKeyboardSound and previewKeyboardSound safely in headless environment", () => {
    expect(() => {
      playKeyboardSound({ key: "a", code: "KeyA", style: "soft", volume: 0.5 });
      playKeyboardSound({ key: " ", code: "Space", style: "thock", volume: 0.6 });
      playKeyboardSound({ key: "Enter", code: "Enter", style: "mechanical", volume: 0.7 });
      playKeyboardSound({ key: "Backspace", code: "Backspace", style: "typewriter", volume: 0.4 });
      playKeyboardSound({ key: "k", code: "KeyK", style: "bubble", volume: 0.5 });
      playKeyboardSound({ enabled: false, key: "m" });
      previewKeyboardSound({ style: "thock", volume: 0.5 });
    }).not.toThrow();
  });
});
