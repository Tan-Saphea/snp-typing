import { useEffect, useMemo, useState } from "react";

import { useAuthStore } from "../../stores/authStore.js";
import { ENGLISH_OUTPUTS, findKeyForOutput, getKeyboardOutput, KHMER_OUTPUTS } from "./keyboardLayouts.js";
import { playKeyboardSound } from "./keyboardSound.js";

const key = (code, primary, options = {}) => ({ code, primary, ...options });

// A learning keyboard keeps only the keys used by lessons. Removing function,
// navigation, and system keys gives children larger targets and less clutter.
const learningRows = [
  [
    key("Backquote", "`", { secondary: "~" }),
    key("Digit1", "1", { secondary: "!" }), key("Digit2", "2", { secondary: "@" }),
    key("Digit3", "3", { secondary: "#" }), key("Digit4", "4", { secondary: "$" }),
    key("Digit5", "5", { secondary: "%" }), key("Digit6", "6", { secondary: "^" }),
    key("Digit7", "7", { secondary: "&" }), key("Digit8", "8", { secondary: "*" }),
    key("Digit9", "9", { secondary: "(" }), key("Digit0", "0", { secondary: ")" }),
    key("Minus", "-", { secondary: "_" }), key("Equal", "=", { secondary: "+" }),
    key("Backspace", "Backspace", { dark: true, unit: 2.2, action: "Backspace", icon: "←" }),
  ],
  [
    ..."QWERTYUIOP".split("").map((label) => key(`Key${label}`, label)),
    key("BracketLeft", "[", { secondary: "{" }), key("BracketRight", "]", { secondary: "}" }),
    key("Backslash", "\\", { secondary: "|", unit: 1.25 }),
  ],
  [
    ..."ASDFGHJKL".split("").map((label) => key(`Key${label}`, label)),
    key("Semicolon", ";", { secondary: ":" }), key("Quote", "'", { secondary: "\"" }),
    key("Enter", "Enter", { dark: true, unit: 1.9, action: "\n", icon: "↵" }),
  ],
  [
    key("ShiftLeft", "Shift", { dark: true, unit: 2.15, icon: "⇧" }),
    ..."ZXCVBNM".split("").map((label) => key(`Key${label}`, label)),
    key("Comma", ",", { secondary: "<" }), key("Period", ".", { secondary: ">" }),
    key("Slash", "/", { secondary: "?" }),
    key("ShiftRight", "Shift", { dark: true, unit: 2.15, icon: "⇧" }),
  ],
  [key("AltRight", "AltGr", { dark: true, basis: "12%" }), key("Space", "Space", { basis: "44%", action: " " })],
];

const fingerAssignments = {
  left: {
    pinky: ["Backquote", "Digit1", "KeyQ", "KeyA", "KeyZ", "ShiftLeft"],
    ring: ["Digit2", "KeyW", "KeyS", "KeyX"],
    middle: ["Digit3", "KeyE", "KeyD", "KeyC"],
    index: ["Digit4", "Digit5", "KeyR", "KeyT", "KeyF", "KeyG", "KeyV", "KeyB"],
    thumb: ["Space"],
  },
  right: {
    thumb: ["Space", "AltRight"],
    index: ["Digit6", "Digit7", "KeyY", "KeyU", "KeyH", "KeyJ", "KeyN", "KeyM"],
    middle: ["Digit8", "KeyI", "KeyK", "Comma"],
    ring: ["Digit9", "KeyO", "KeyL", "Period"],
    pinky: ["Digit0", "Minus", "Equal", "KeyP", "BracketLeft", "BracketRight", "Backslash", "Semicolon", "Quote", "Slash", "Backspace", "Enter", "ShiftRight"],
  },
};

const copy = {
  en: {
    title: "Learning keyboard",
    help: "Press the yellow key. Wrong keys are counted, then you can try again immediately.",
    next: "Next key",
    ready: "Mission complete",
    nextLegend: "Next",
    pressedLegend: "Pressed",
    finger(assignment, shifted, altGr) { return assignment ? `${shifted ? "Hold the opposite Shift · " : altGr ? "Hold AltGr · " : ""}Use your ${assignment.hand} ${assignment.finger}` : "Follow the highlighted key"; },
  },
  km: {
    title: "ក្ដារចុចខ្មែរ NIDA",
    help: "ចុចគ្រាប់ចុចពណ៌លឿង។ បើវាយខុស អ្នកអាចសាកម្ដងទៀតភ្លាមៗ។",
    next: "គ្រាប់ចុចបន្ទាប់",
    ready: "បេសកកម្មបានបញ្ចប់",
    nextLegend: "បន្ទាប់",
    pressedLegend: "បានចុច",
    finger(assignment, shifted, altGr) { return assignment ? `${shifted ? "កាន់ Shift ផ្ទុយដៃ · " : altGr ? "កាន់ AltGr · " : ""}ប្រើ${assignment.hand === "left" ? "ដៃឆ្វេង" : "ដៃស្តាំ"}` : "ចុចគ្រាប់ចុចដែលភ្លឺ"; },
  },
};

function getFingerAssignment(code) {
  for (const [hand, fingers] of Object.entries(fingerAssignments)) {
    for (const [finger, codes] of Object.entries(fingers)) {
      if (codes.includes(code)) return { hand, finger };
    }
  }
  return null;
}

function getPreferredShiftCode(nextKey) {
  if (!nextKey.shifted) return "";
  return getFingerAssignment(nextKey.code)?.hand === "left" ? "ShiftRight" : "ShiftLeft";
}

function getPreferredAltGrCode(nextKey) {
  return nextKey.altGr ? "AltRight" : "";
}

function displayOutput(output, language) {
  if (output === " ") return language === "km" ? "ចន្លោះ" : "Space";
  if (output === "\n") return language === "km" ? "បន្ទាត់ថ្មី" : "Enter";
  return output;
}

function outputForKey(item, language, modifier) {
  if (item.action !== undefined) return item.action;
  return getKeyboardOutput(language, item.code, modifier);
}

function KeyboardKey({ activeAltGrCode, activeShiftCode, hasError, item, language, nextKey, preferredAltGrCode, preferredShiftCode, pressedCode, onPress }) {
  const isShift = item.code === "ShiftLeft" || item.code === "ShiftRight";
  const shiftActive = Boolean(activeShiftCode);
  const altGrActive = Boolean(activeAltGrCode);
  const isNext = item.code === nextKey.code || item.code === preferredShiftCode || item.code === preferredAltGrCode;
  const isPressed = item.code === pressedCode || item.code === activeShiftCode || item.code === activeAltGrCode;
  const layout = language === "km" ? KHMER_OUTPUTS : ENGLISH_OUTPUTS;
  const outputs = layout[item.code];
  const activeOutputIndex = altGrActive ? 2 : shiftActive ? 1 : 0;
  const localizedLabel = item.action === undefined ? outputs?.[activeOutputIndex] ?? outputs?.[0] : "";
  const label = localizedLabel || item.primary;
  const alternate = outputs?.[altGrActive || shiftActive ? 0 : 1] ?? item.secondary;
  const assignment = getFingerAssignment(item.code);
  const fingerClass = assignment ? `snp-key-finger-${assignment.hand}-${assignment.finger}` : "";

  return (
    <button
      aria-label={`${label}${isNext ? ", next key" : ""}`}
      className={`snp-keyboard-key ${fingerClass} ${item.dark ? "snp-keyboard-key-dark" : ""} ${isNext ? "snp-keyboard-key-next" : ""} ${isNext && hasError ? "snp-keyboard-key-error" : ""} ${isPressed ? "snp-keyboard-key-pressed" : ""}`}
      data-code={item.code}
      onClick={() => onPress(item)}
      style={{ flexGrow: item.basis ? 0 : item.unit ?? 1, flexBasis: item.basis ?? 0 }}
      type="button"
    >
      {alternate && alternate !== label && <span className="snp-keyboard-key-secondary">{alternate}</span>}
      <span className={localizedLabel ? "snp-keyboard-key-main-localized" : ""}>{item.icon && <span aria-hidden="true" className="mr-1">{item.icon}</span>}{label}</span>
      {language === "km" && outputs && item.action === undefined && !isShift && <span className="snp-keyboard-key-latin">{item.primary}</span>}
    </button>
  );
}

const fingers = ["pinky", "ring", "middle", "index", "thumb"];

function Hand({ activeFinger, hand }) {
  const orderedFingers = hand === "left" ? fingers : [...fingers].reverse();
  return (
    <div className={`snp-hand snp-hand-${hand}`}>
      <div className="snp-hand-fingers">{orderedFingers.map((finger) => <span className={`snp-hand-finger snp-hand-finger-${finger} ${activeFinger === finger ? "is-active" : ""}`} key={finger} />)}</div>
      <div className={`snp-hand-palm ${activeFinger === "thumb" ? "is-active" : ""}`}><span>{hand === "left" ? "Left" : "Right"}</span></div>
    </div>
  );
}

function FingerGuide({ language, nextKey }) {
  const words = copy[language === "km" ? "km" : "en"];
  const assignment = getFingerAssignment(nextKey.code);
  const isSpace = nextKey.code === "Space";
  const leftFinger = isSpace ? "thumb" : assignment?.hand === "left" ? assignment.finger : nextKey.shifted ? "pinky" : "";
  const rightFinger = isSpace ? "thumb" : assignment?.hand === "right" ? assignment.finger : nextKey.altGr ? "thumb" : nextKey.shifted ? "pinky" : "";
  const keyName = nextKey.code ? `${nextKey.shifted ? "⇧ + " : nextKey.altGr ? "AltGr + " : ""}${nextKey.code.replace(/^Key|^Digit/, "")}` : "✓";

  return (
    <div className="snp-finger-guide" aria-live="polite">
      <Hand activeFinger={leftFinger} hand="left" />
      <div className="snp-finger-instruction"><span className="snp-finger-key">{keyName}</span><p>{words.finger(assignment, nextKey.shifted, nextKey.altGr)}</p></div>
      <Hand activeFinger={rightFinger} hand="right" />
    </div>
  );
}

export default function VirtualKeyboard({ compact = false, hasError = false, language, nextText = "", onKeyPress, session = false }) {
  const preferences = useAuthStore((state) => state.user?.preferences);
  const soundEnabled = preferences?.soundEnabled !== false;
  const soundStyle = preferences?.soundStyle ?? "soft";
  const soundVolume = preferences?.soundVolume ?? 0.35;
  const showHandGuide = preferences?.handGuide !== false;
  const words = copy[language === "km" ? "km" : "en"];
  const [pressedCode, setPressedCode] = useState("");
  const [activeShiftCode, setActiveShiftCode] = useState("");
  const [activeAltGrCode, setActiveAltGrCode] = useState("");
  const nextKey = useMemo(() => findKeyForOutput(language, nextText), [language, nextText]);
  const preferredShiftCode = getPreferredShiftCode(nextKey);
  const preferredAltGrCode = getPreferredAltGrCode(nextKey);

  useEffect(() => {
    function press(event) {
      if (event.repeat || event.isComposing || ["Dead", "Process", "Unidentified"].includes(event.key)) return;
      setPressedCode(event.code);
      if (event.key === "Shift") { setActiveShiftCode(event.code); setActiveAltGrCode(""); }
      if (event.key === "AltGraph" || event.code === "AltRight") { setActiveAltGrCode(event.code); setActiveShiftCode(""); }
      playKeyboardSound({ enabled: soundEnabled, key: event.key, style: soundStyle, volume: soundVolume });
    }
    function release(event) {
      setPressedCode((current) => current === event.code ? "" : current);
      if (event.key === "Shift") setActiveShiftCode((current) => current === event.code ? "" : current);
      if (event.key === "AltGraph" || event.code === "AltRight") setActiveAltGrCode((current) => current === event.code ? "" : current);
    }
    function clear() { setPressedCode(""); setActiveShiftCode(""); setActiveAltGrCode(""); }
    window.addEventListener("keydown", press);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", clear);
    };
  }, [soundEnabled, soundStyle, soundVolume]);

  function handlePress(item) {
    setPressedCode(item.code);
    window.setTimeout(() => setPressedCode((current) => current === item.code ? "" : current), 120);
    playKeyboardSound({ enabled: soundEnabled, key: item.action ?? item.primary, style: soundStyle, volume: soundVolume });
    if (item.code === "ShiftLeft" || item.code === "ShiftRight") {
      setActiveAltGrCode("");
      setActiveShiftCode((current) => current === item.code ? "" : item.code);
      return;
    }
    if (item.code === "AltRight") {
      setActiveShiftCode("");
      setActiveAltGrCode((current) => current === item.code ? "" : item.code);
      return;
    }
    const modifier = activeAltGrCode ? "altGr" : activeShiftCode ? "shift" : false;
    const output = outputForKey(item, language, modifier);
    if (output) onKeyPress?.(output);
    if (activeShiftCode) setActiveShiftCode("");
    if (activeAltGrCode) setActiveAltGrCode("");
  }

  const keyProps = { activeAltGrCode, activeShiftCode, hasError, language, nextKey, preferredAltGrCode, preferredShiftCode, pressedCode, onPress: handlePress };
  const promptKey = nextKey.code ? `${nextKey.shifted ? "⇧ + " : nextKey.altGr ? "AltGr + " : ""}${nextKey.code.replace(/^Key|^Digit/, "")}` : "✓";

  return (
    <section className={`snp-keyboard-shell ${compact ? "snp-keyboard-shell-compact" : ""} ${session ? "snp-keyboard-session" : ""}`} aria-label={`${language === "km" ? "Khmer NIDA" : "English"} learning keyboard`}>
      <div className="snp-keyboard-header">
        <div className="min-w-0"><p className="snp-keyboard-title">{words.title}</p><p className="snp-keyboard-help">{words.help}</p></div>
        <div className={`snp-next-key-prompt ${hasError ? "is-error" : ""}`} aria-live="polite"><span>{nextKey.code ? words.next : words.ready}</span><b>{promptKey}</b>{nextKey.output && <i>→ {displayOutput(nextKey.output, language)}</i>}</div>
        <div className="snp-keyboard-legend"><span><i className="bg-amber-300" />{words.nextLegend}</span><span><i className="bg-emerald-600" />{words.pressedLegend}</span></div>
      </div>
      <div className="snp-keyboard-scroll">
        <div className={`snp-keyboard ${compact ? "snp-keyboard-compact" : ""}`}>
          {learningRows.map((row, rowIndex) => <div className={`snp-keyboard-row ${rowIndex === learningRows.length - 1 ? "snp-keyboard-space-row" : ""}`} key={rowIndex}>{row.filter((item) => language === "km" || item.code !== "AltRight").map((item) => <KeyboardKey item={item} key={item.code} {...keyProps} />)}</div>)}
        </div>
      </div>
      {showHandGuide && !compact && <FingerGuide language={language} nextKey={nextKey} />}
    </section>
  );
}
