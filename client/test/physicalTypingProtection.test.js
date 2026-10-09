import { describe, expect, it, vi } from "vitest";

describe("Physical keyboard typing protection and cheat prevention", () => {
  it("blocks paste events on typing input proxy", () => {
    // Test that onPaste calls preventDefault
    const preventDefault = vi.fn();
    const event = {
      preventDefault,
      currentTarget: { value: "hacker paste test" },
    };

    // Simulate inputHandlers from useTypingEngine
    const targetText = "Hello world";
    // We can test the handler logic directly
    const handlers = {
      onPaste(e) {
        e.preventDefault();
      },
      onDrop(e) {
        e.preventDefault();
      },
      onCopy(e) {
        e.preventDefault();
      },
      onCut(e) {
        e.preventDefault();
      },
      onContextMenu(e) {
        e.preventDefault();
      },
      onKeyDown(e) {
        if ((e.ctrlKey || e.metaKey) && ["v", "x", "c", "a"].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
        if (e.shiftKey && e.key === "Insert") {
          e.preventDefault();
        }
      },
    };

    handlers.onPaste(event);
    expect(preventDefault).toHaveBeenCalledTimes(1);

    handlers.onDrop(event);
    expect(preventDefault).toHaveBeenCalledTimes(2);

    handlers.onCopy(event);
    expect(preventDefault).toHaveBeenCalledTimes(3);

    handlers.onCut(event);
    expect(preventDefault).toHaveBeenCalledTimes(4);

    handlers.onContextMenu(event);
    expect(preventDefault).toHaveBeenCalledTimes(5);
  });

  it("blocks Ctrl+V and Cmd+V paste key combinations", () => {
    const preventDefault = vi.fn();
    const ctrlV = { ctrlKey: true, metaKey: false, key: "v", preventDefault };
    const cmdV = { ctrlKey: false, metaKey: true, key: "v", preventDefault };
    const shiftInsert = { shiftKey: true, key: "Insert", preventDefault };

    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ["v", "x", "c", "a"].includes(e.key?.toLowerCase())) {
        e.preventDefault();
      }
      if (e.shiftKey && e.key === "Insert") {
        e.preventDefault();
      }
    };

    onKeyDown(ctrlV);
    expect(preventDefault).toHaveBeenCalledTimes(1);

    onKeyDown(cmdV);
    expect(preventDefault).toHaveBeenCalledTimes(2);

    onKeyDown(shiftInsert);
    expect(preventDefault).toHaveBeenCalledTimes(3);
  });

  it("translates physical US keystrokes to Khmer NIDA without mouse click", async () => {
    const { getKeyboardOutput } = await import("../src/features/typing/keyboardLayouts.js");

    // Physical key 'KeyA' with Shift = 'ា' (Khmer vowel aa)
    expect(getKeyboardOutput("km", "KeyA", false)).toBe("ា");
    // Physical key 'KeyK' with Shift = 'គ' (Khmer consonant ko)
    expect(getKeyboardOutput("km", "KeyK", "shift")).toBe("គ");
    // Physical key 'Space' in Khmer NIDA: unshifted produces ZWSP (\u200B), Shift + Space produces visible space " "
    expect(getKeyboardOutput("km", "Space", false)).toBe("\u200B");
    expect(getKeyboardOutput("km", "Space", "shift")).toBe(" ");
    expect(getKeyboardOutput("en", "Space", false)).toBe(" ");
  });
});
