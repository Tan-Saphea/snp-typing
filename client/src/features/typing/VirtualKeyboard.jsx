import { memo, useEffect, useMemo, useRef, useState } from "react";
import { LuKeyboard } from "react-icons/lu";
import { useAuthStore } from "../../stores/authStore.js";
import { findKeyForOutput } from "./keyboardLayouts.js";
import { playKeyboardSound } from "./keyboardSound.js";

const key = (code, primary, options = {}) => ({ code, primary, ...options });

// Detailed keyboard rows structured after the official Khmer NIDA keyboard with 4-quadrant keycaps
const fullKeyboardRows = [
  // Row 1: Number Row
  [
    key("Backquote", "`", {
      topLeft: "ZWJ >>",
      topRight: "»",
      bottomLeft: "~ <<",
      bottomRight: "«",
      enSecondary: "~",
    }),
    key("Digit1", "1", {
      topLeft: "ZWNJ",
      topRight: "!",
      bottomLeft: "1",
      bottomRight: "១",
      enSecondary: "!",
    }),
    key("Digit2", "2", {
      topLeft: "@",
      topRight: "ៗ",
      bottomLeft: "2",
      bottomRight: "២",
      enSecondary: "@",
    }),
    key("Digit3", "3", {
      topLeft: "៑",
      topRight: '"',
      bottomLeft: "3",
      bottomRight: "៣",
      enSecondary: "#",
    }),
    key("Digit4", "4", {
      topLeft: "$",
      topRight: "៛",
      bottomLeft: "4",
      bottomRight: "៤",
      enSecondary: "$",
    }),
    key("Digit5", "5", {
      topLeft: "€",
      topRight: "%",
      bottomLeft: "5",
      bottomRight: "៥",
      enSecondary: "%",
    }),
    key("Digit6", "6", {
      topLeft: "៙",
      topRight: "៍",
      bottomLeft: "6",
      bottomRight: "៦",
      enSecondary: "^",
    }),
    key("Digit7", "7", {
      topLeft: "៚",
      topRight: "័",
      bottomLeft: "7",
      bottomRight: "៧",
      enSecondary: "&",
    }),
    key("Digit8", "8", {
      topLeft: "*",
      topRight: "៏",
      bottomLeft: "8",
      bottomRight: "៨",
      enSecondary: "*",
    }),
    key("Digit9", "9", {
      topLeft: "{",
      topRight: "(",
      bottomLeft: "9",
      bottomRight: "៩",
      enSecondary: "(",
    }),
    key("Digit0", "0", {
      topLeft: "}",
      topRight: ")",
      bottomLeft: "0",
      bottomRight: "០",
      enSecondary: ")",
    }),
    key("Minus", "-", {
      topLeft: "×",
      topRight: "៌",
      bottomLeft: "-",
      bottomRight: "ឥ",
      enSecondary: "_",
    }),
    key("Equal", "=", {
      topLeft: "±",
      topRight: "៎",
      bottomLeft: "=",
      bottomRight: "ឲ",
      enSecondary: "+",
    }),
    key("Backspace", "Backspace", {
      isModifier: true,
      unit: 1.8,
      action: "Backspace",
      icon: "←",
    }),
  ],

  // Row 2: Top Alphabet Row
  [
    key("Tab", "Tab", {
      isModifier: true,
      unit: 1.5,
      enLabel: "TAB",
      icon: "⇄",
      kmLabel: "ថេប",
    }),
    key("KeyQ", "Q", { topRight: "ឈ", bottomLeft: "Q", bottomRight: "ឆ" }),
    key("KeyW", "W", { topRight: "ឺ", bottomLeft: "W", bottomRight: "ឹ" }),
    key("KeyE", "E", { topLeft: "ឯ", topRight: "ែ", bottomLeft: "E", bottomRight: "េ" }),
    key("KeyR", "R", { topLeft: "ឫ", topRight: "ឬ", bottomLeft: "R", bottomRight: "រ" }),
    key("KeyT", "T", { topRight: "ទ", bottomLeft: "T", bottomRight: "ត" }),
    key("KeyY", "Y", { topRight: "ួ", bottomLeft: "Y", bottomRight: "យ" }),
    key("KeyU", "U", { topRight: "ូ", bottomLeft: "U", bottomRight: "ុ" }),
    key("KeyI", "I", { topLeft: "ឦ", topRight: "ី", bottomLeft: "I", bottomRight: "ិ" }),
    key("KeyO", "O", { topLeft: "ឱ", topRight: "ៅ", bottomLeft: "O", bottomRight: "ោ" }),
    key("KeyP", "P", { topLeft: "ឰ", topRight: "ភ", bottomLeft: "P", bottomRight: "ផ" }),
    key("BracketLeft", "[", {
      topLeft: "ឩ",
      topRight: "ឿ",
      bottomLeft: "[",
      bottomRight: "ៀ",
      enSecondary: "{",
    }),
    key("BracketRight", "]", {
      topLeft: "ឳ",
      topRight: "ឧ",
      bottomLeft: "]",
      bottomRight: "ឪ",
      enSecondary: "}",
    }),
    key("Backslash", "\\", {
      topLeft: "\\",
      topRight: "ឭ",
      bottomLeft: "\\",
      bottomRight: "ឮ",
      enSecondary: "|",
      unit: 1.25,
    }),
  ],

  // Row 3: Home Row
  [
    key("CapsLock", "CapsLock", {
      isModifier: true,
      unit: 1.8,
      enLabel: "CAPS LOCK",
      kmLabel: "ប្ដូរជាប់",
    }),
    key("KeyA", "A", { topRight: "ាំ", bottomLeft: "A", bottomRight: "ា" }),
    key("KeyS", "S", { topRight: "ៃ", bottomLeft: "S", bottomRight: "ស" }),
    key("KeyD", "D", { topRight: "ឌ", bottomLeft: "D", bottomRight: "ដ" }),
    key("KeyF", "F", { topRight: "ធ", bottomLeft: "F", bottomRight: "ថ" }),
    key("KeyG", "G", { topRight: "អ", bottomLeft: "G", bottomRight: "ង" }),
    key("KeyH", "H", { topRight: "ះ", bottomLeft: "H", bottomRight: "ហ" }),
    key("KeyJ", "J", { topRight: "ញ", bottomLeft: "J", bottomRight: "្" }),
    key("KeyK", "K", { topRight: "គ", bottomLeft: "K", bottomRight: "ក" }),
    key("KeyL", "L", { topRight: "ឡ", bottomLeft: "L", bottomRight: "ល" }),
    key("Semicolon", ";", {
      topLeft: "៖",
      topRight: "ោះ",
      bottomLeft: ";",
      bottomRight: "ើ",
      enSecondary: ":",
    }),
    key("Quote", "'", {
      topLeft: "ៈ",
      topRight: "៉",
      bottomLeft: "'",
      bottomRight: "់",
      enSecondary: '"',
    }),
    key("Enter", "Enter", {
      isModifier: true,
      unit: 2.2,
      enLabel: "ENTER",
      icon: "↵",
      kmLabel: "បញ្ចូល",
      action: "\n",
    }),
  ],

  // Row 4: Bottom Alphabet Row
  [
    key("ShiftLeft", "Shift", {
      isModifier: true,
      unit: 2.3,
      enLabel: "SHIFT",
      kmLabel: "ប្ដូរ",
      icon: "⇧",
    }),
    key("KeyZ", "Z", { topRight: "ឍ", bottomLeft: "Z", bottomRight: "ឋ" }),
    key("KeyX", "X", { topRight: "ឃ", bottomLeft: "X", bottomRight: "ខ" }),
    key("KeyC", "C", { topRight: "ជ", bottomLeft: "C", bottomRight: "ច" }),
    key("KeyV", "V", { topRight: "េះ", bottomLeft: "V", bottomRight: "វ" }),
    key("KeyB", "B", { topRight: "ព", bottomLeft: "B", bottomRight: "ប" }),
    key("KeyN", "N", { topRight: "ណ", bottomLeft: "N", bottomRight: "ន" }),
    key("KeyM", "M", { topRight: "ំ", bottomLeft: "M", bottomRight: "ម" }),
    key("Comma", ",", {
      topLeft: "<",
      topRight: "ុះ",
      bottomLeft: ",",
      bottomRight: "ុំ",
      enSecondary: "<",
    }),
    key("Period", ".", {
      topLeft: ">",
      topRight: "៕",
      bottomLeft: ".",
      bottomRight: "។",
      enSecondary: ">",
    }),
    key("Slash", "/", {
      topLeft: "/",
      topRight: "?",
      bottomLeft: "/",
      bottomRight: "៊",
      enSecondary: "?",
    }),
    key("ShiftRight", "Shift", {
      isModifier: true,
      unit: 2.7,
      enLabel: "SHIFT",
      kmLabel: "ប្ដូរ",
      icon: "⇧",
    }),
  ],

  // Row 5: Space & Controls Row
  [
    key("ControlLeft", "Ctrl", {
      isModifier: true,
      unit: 1.5,
      enLabel: "CTRL",
      kmLabel: "បញ្ជា",
    }),
    key("SpacerLeft", "", { isEmpty: true, unit: 1.1 }),
    key("AltLeft", "Alt", {
      isModifier: true,
      unit: 1.3,
      enLabel: "ALT",
      kmLabel: "ជំនួស",
    }),
    key("Space", "Space", {
      isSpace: true,
      unit: 6.2,
      action: " ",
      kmTopLeft: "",
      enBottomLeft: "SPACE",
      kmRightMain: "ដកឃ្លា (⇧ + Space)",
      kmRightSub: "",
    }),
    key("AltRight", "AltGr", {
      isModifier: true,
      unit: 1.3,
      enLabel: "ALT GR",
      kmLabel: "ឆ្លាស់",
    }),
    key("SpacerRight", "", { isEmpty: true, unit: 1.1 }),
    key("ControlRight", "Ctrl", {
      isModifier: true,
      unit: 1.5,
      enLabel: "CTRL",
      kmLabel: "បញ្ជា",
    }),
  ],
];

const fingerAssignments = {
  left: {
    pinky: ["Backquote", "Digit1", "KeyQ", "KeyA", "KeyZ", "Tab", "CapsLock", "ShiftLeft", "ControlLeft"],
    ring: ["Digit2", "KeyW", "KeyS", "KeyX"],
    middle: ["Digit3", "KeyE", "KeyD", "KeyC"],
    index: ["Digit4", "Digit5", "KeyR", "KeyT", "KeyF", "KeyG", "KeyV", "KeyB"],
    thumb: ["Space", "AltLeft"],
  },
  right: {
    thumb: ["Space", "AltRight"],
    index: ["Digit6", "Digit7", "KeyY", "KeyU", "KeyH", "KeyJ", "KeyN", "KeyM"],
    middle: ["Digit8", "KeyI", "KeyK", "Comma"],
    ring: ["Digit9", "KeyO", "KeyL", "Period"],
    pinky: [
      "Digit0", "Minus", "Equal", "KeyP", "BracketLeft", "BracketRight", "Backslash",
      "Semicolon", "Quote", "Slash", "Backspace", "Enter", "ShiftRight", "ControlRight",
    ],
  },
};

const fingerNamesKm = {
  thumb: "មេដៃ",
  index: "ម្រាមចង្អុល",
  middle: "ម្រាមកណ្ដាល",
  ring: "ម្រាមនាង",
  pinky: "កូនដៃ",
};

const handNamesKm = {
  left: "ឆ្វេង",
  right: "ស្ដាំ",
};

const copy = {
  en: {
    title: "Khmer NIDA & English Keyboard",
    help: "Press the highlighted key on your keyboard to continue your typing exercise.",
    next: "Next Key",
    ready: "Completed",
    nextLegend: "Next Target",
    pressedLegend: "Key Pressed",
    finger(assignment, shifted, altGr, targetLabel) {
      if (!assignment) return "Follow the highlighted key";
      const hand = assignment.hand === "left" ? "Left" : "Right";
      const oppositeHand = assignment.hand === "left" ? "Right" : "Left";
      const finger = assignment.finger.charAt(0).toUpperCase() + assignment.finger.slice(1);
      const label = targetLabel ? ` "${targetLabel}"` : "";

      if (assignment?.finger === "thumb" || targetLabel === " " || targetLabel === "\u200B") {
        if (shifted) {
          return "Hold Left Shift + Press Space with Thumb";
        }
        return "Press Space with Thumb";
      }
      if (shifted) {
        return `Hold ${oppositeHand} Shift + Press${label} with ${hand} ${finger}`;
      }
      if (altGr) {
        return `Hold Right AltGr + Press${label} with ${hand} ${finger}`;
      }
      return `Press${label} with ${hand} ${finger}`;
    },
  },
  km: {
    title: "ក្ដារចុចខ្មែរ NIDA",
    help: "ចុចគ្រាប់ចុចពណ៌លឿងដែលភ្លឺ។ មើលការណែនាំម្រាមដៃឆ្វេង និងស្ដាំ។",
    next: "គ្រាប់ចុចបន្ទាប់",
    ready: "បានបញ្ចប់",
    nextLegend: "គ្រាប់ចុចបន្ទាប់",
    pressedLegend: "បានចុច",
    finger(assignment, shifted, altGr, targetLabel) {
      if (!assignment && targetLabel !== " ") return "ចុចគ្រាប់ចុចដែលភ្លឺ";
      const fingerKm = assignment ? (fingerNamesKm[assignment.finger] || assignment.finger) : "មេដៃ";
      const handKm = assignment ? (handNamesKm[assignment.hand] || assignment.hand) : "ស្ដាំ";
      const oppositeHandKm = assignment?.hand === "left" ? "ស្ដាំ" : "ឆ្វេង";
      const label = targetLabel ? ` "${targetLabel}"` : "";

      if (assignment?.finger === "thumb" || targetLabel === " " || targetLabel === "\u200B") {
        if (shifted) {
          return "កាន់ Shift (ឆ្វេង) + ចុច ដកឃ្លា (Space) ដោយមេដៃ ដើម្បីដកឃ្លា";
        }
        return "ចុច ដកឃ្លា (Space) ដោយមេដៃ";
      }
      if (shifted) {
        return `កាន់ Shift ${oppositeHandKm} + ចុច${label} ដោយ${fingerKm}${handKm}`;
      }
      if (altGr) {
        return `កាន់ AltGr ស្ដាំ + ចុច${label} ដោយ${fingerKm}${handKm}`;
      }
      return `ចុច${label} ដោយ${fingerKm}${handKm}`;
    },
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
  if (nextKey.code === "Space") return "ShiftLeft";
  return getFingerAssignment(nextKey.code)?.hand === "left" ? "ShiftRight" : "ShiftLeft";
}

function getPreferredAltGrCode(nextKey) {
  return nextKey.altGr ? "AltRight" : "";
}

function displayOutput(output, language, shifted) {
  if (output === " " || output === "\u200B") {
    if (language === "km") {
      return shifted ? "ដកឃ្លា (Shift + Space)" : "ដកឃ្លាមិនឃើញ (ZWSP)";
    }
    return "Space";
  }
  if (output === "\n") return language === "km" ? "បន្ទាត់ថ្មី (Enter)" : "Enter";
  return output;
}

const KeyboardKey = memo(function KeyboardKey({
  hasError,
  isAltGrModifier,
  isNext,
  isPressed,
  isShiftModifier,
  isTargetKey,
  item,
  language,
  targetQuadrant,
}) {
  if (item.isEmpty) {
    return (
      <div
        className="snp-keyboard-key-empty rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-800/40"
        style={{ flexGrow: item.unit ?? 1 }}
      />
    );
  }

  const isKhmer = language === "km";
  const assignment = getFingerAssignment(item.code);
  const fingerClass = assignment
    ? `snp-key-finger-${assignment.hand}-${assignment.finger}`
    : "";

  // Handle Space Bar rendering
  if (item.isSpace) {
    return (
      <div
        role="presentation"
        className={`snp-keyboard-key snp-keyboard-space select-none cursor-default ${fingerClass} ${
          isNext ? "snp-keyboard-key-next" : ""
        } ${isNext && hasError ? "snp-keyboard-key-error" : ""} ${
          isPressed ? "snp-keyboard-key-pressed" : ""
        }`}
        style={{ flexGrow: item.unit ?? 6.2 }}
      >
        <div className="flex w-full items-center justify-between px-3 text-slate-500 dark:text-slate-400 select-none">
          <div className="text-left">
            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500">
              {item.kmTopLeft}
            </span>
            <span
              className={`block text-[11px] font-black ${
                isNext ? "text-slate-950 font-black" : "text-slate-700 dark:text-slate-200"
              }`}
            >
              {item.enBottomLeft}
            </span>
          </div>
          <div className="text-right">
            <span
              className={`block text-xs font-black ${
                isNext ? "text-slate-950 font-black scale-105" : "text-indigo-600 dark:text-indigo-400"
              }`}
            >
              {item.kmRightMain}
            </span>
            <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500">
              {item.kmRightSub}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Handle Modifier Keys (Tab, Caps, Shift, Backspace, Enter, Ctrl, Alt)
  if (item.isModifier) {
    const modifierClass = isShiftModifier
      ? "snp-keyboard-key-shift"
      : isNext
      ? "snp-keyboard-key-next"
      : "";

    return (
      <div
        role="presentation"
        className={`snp-keyboard-key snp-keyboard-key-modifier select-none cursor-default ${fingerClass} ${modifierClass} ${
          isNext && hasError ? "snp-keyboard-key-error" : ""
        } ${isPressed ? "snp-keyboard-key-pressed" : ""}`}
        style={{ flexGrow: item.unit ?? 1 }}
      >
        <div className="flex flex-col items-center justify-center text-center select-none leading-tight">
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase text-slate-700 dark:text-slate-300">
            {item.enLabel || item.primary}
            {item.icon && <span className="text-sm font-bold">{item.icon}</span>}
          </span>
          {isShiftModifier ? (
            <span className="text-[9px] font-black tracking-tight text-emerald-950 uppercase bg-white/70 dark:bg-white/60 px-1.5 py-0.5 rounded mt-0.5 animate-pulse">
              {isKhmer ? "កាន់ SHIFT" : "HOLD SHIFT"}
            </span>
          ) : isAltGrModifier ? (
            <span className="text-[9px] font-black tracking-tight text-amber-950 uppercase bg-white/70 dark:bg-white/60 px-1.5 py-0.5 rounded mt-0.5 animate-pulse">
              {isKhmer ? "កាន់ ALT GR" : "HOLD ALT GR"}
            </span>
          ) : item.kmLabel ? (
            <span className="text-[11px] sm:text-xs font-black text-indigo-600 dark:text-indigo-400 leading-tight">
              {item.kmLabel}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  // Handle Standard Alphanumeric Keys (4-Quadrant layout)
  return (
    <div
      role="presentation"
      className={`snp-keyboard-key select-none cursor-default ${fingerClass} ${
        isNext ? "snp-keyboard-key-next" : ""
      } ${isNext && hasError ? "snp-keyboard-key-error" : ""} ${
        isPressed ? "snp-keyboard-key-pressed" : ""
      }`}
      style={{ flexGrow: item.unit ?? 1 }}
    >
      {/* Top Left: AltGr / Secondary Symbol */}
      <span
        className={`snp-key-top-left ${
          targetQuadrant === "topLeft" ? "snp-quadrant-target" : ""
        }`}
      >
        {isKhmer ? item.topLeft || "" : item.enSecondary || ""}
      </span>

      {/* Top Right: Shifted Khmer Character */}
      <span
        className={`snp-key-top-right ${
          targetQuadrant === "topRight" ? "snp-quadrant-target" : ""
        }`}
      >
        {isKhmer ? item.topRight || "" : ""}
      </span>

      {/* Bottom Left: English Latin Letter */}
      <span
        className={`snp-key-bottom-left ${
          targetQuadrant === "bottomLeft" ? "snp-quadrant-target" : ""
        }`}
      >
        {item.bottomLeft || item.primary}
      </span>

      {/* Bottom Right: Base Khmer Character */}
      <span
        className={`snp-key-bottom-right ${
          targetQuadrant === "bottomRight" ? "snp-quadrant-target" : ""
        }`}
      >
        {isKhmer ? item.bottomRight || "" : ""}
      </span>
    </div>
  );
});

const vectorHandFingersData = [
  {
    id: "pinky",
    nameKm: "កូនដៃ",
    nameEn: "Pinky",
    color: "#f43f5e",
    activeColor: "#fb7185",
    d: "M 20,96 C 16,74 19,52 26,46 C 31,41 36,44 38,54 C 40,66 40,80 38,92 Z",
    tip: { x: 29, y: 49 },
  },
  {
    id: "ring",
    nameKm: "ម្រាមនាង",
    nameEn: "Ring",
    color: "#f59e0b",
    activeColor: "#fbbf24",
    d: "M 38,92 C 37,64 42,28 51,22 C 57,17 64,19 65,30 C 66,48 65,70 62,86 Z",
    tip: { x: 55, y: 25 },
  },
  {
    id: "middle",
    nameKm: "ម្រាមកណ្ដាល",
    nameEn: "Middle",
    color: "#10b981",
    activeColor: "#34d399",
    d: "M 62,86 C 62,52 69,14 78,10 C 85,7 91,10 92,22 C 93,42 91,66 88,86 Z",
    tip: { x: 82, y: 15 },
  },
  {
    id: "index",
    nameKm: "ម្រាមចង្អុល",
    nameEn: "Index",
    color: "#06b6d4",
    activeColor: "#22d3ee",
    d: "M 88,86 C 89,56 96,28 105,24 C 112,21 117,25 117,38 C 117,58 114,84 110,106 Z",
    tip: { x: 109, y: 29 },
  },
  {
    id: "thumb",
    nameKm: "មេដៃ",
    nameEn: "Thumb",
    color: "#8b5cf6",
    activeColor: "#a78bfa",
    d: "M 110,106 C 122,102 142,112 153,126 C 159,134 156,145 146,152 C 134,160 122,164 116,168 Z",
    tip: { x: 148, y: 136 },
  },
];

// Sleek, modern anatomical Vector Hand guide with glowing finger feedback
const VectorHand = memo(function VectorHand({ activeFinger, hand, language = "km" }) {
  const isLeft = hand === "left";
  const isKhmer = language === "km";
  const activeFingerObj = vectorHandFingersData.find((f) => f.id === activeFinger);

  const handTitle = isLeft
    ? isKhmer ? "ដៃឆ្វេង" : "Left Hand"
    : isKhmer ? "ដៃស្ដាំ" : "Right Hand";

  const handSub = isLeft ? "Left" : "Right";

  const fingerLabel = activeFingerObj
    ? isKhmer ? activeFingerObj.nameKm : activeFingerObj.nameEn
    : isKhmer ? "សម្រាក" : "Resting";

  return (
    <div className="snp-hand-card w-36 sm:w-40 md:w-44 select-none">
      {/* Hand Title Header */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
            {handTitle}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
            ({handSub})
          </span>
        </div>
        <span
          className={`h-2 w-2 rounded-full transition-colors duration-200 ${
            activeFinger ? "bg-amber-500 animate-ping" : "bg-slate-300 dark:bg-slate-700"
          }`}
        />
      </div>

      {/* Anatomical Vector Hand SVG */}
      <div className="py-2.5 flex items-center justify-center">
        <svg
          viewBox="0 0 168 220"
          className={`w-28 sm:w-32 md:w-36 h-auto transition-transform duration-200 ${
            isLeft ? "" : "-scale-x-100"
          }`}
          style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.06))" }}
          aria-label={`${hand} hand guide`}
        >
          <defs>
            {/* Palm Gradient */}
            <linearGradient id="palmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>
            <linearGradient id="palmGradDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            {/* Inactive Finger Gradient */}
            <linearGradient id="fingerIdleGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
            <linearGradient id="fingerIdleGradDark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            {/* Glowing filter for active fingertip */}
            <filter id="handGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Palm Base Contour */}
          <path
            d="M 20,96 C 14,130 18,172 32,205 C 50,212 82,212 98,205 C 107,192 112,180 116,168 L 110,106 L 88,86 L 62,86 L 38,92 Z"
            fill="url(#palmGrad)"
            stroke="#64748b"
            strokeWidth="2.2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="dark:fill-[url(#palmGradDark)] dark:stroke-slate-600"
          />

          {/* Subtle Anatomical Palm Creases */}
          <path
            d="M 106,120 C 85,138 65,158 58,185"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.45"
            className="dark:stroke-slate-500"
          />
          <path
            d="M 32,122 C 55,128 80,126 102,134"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.45"
            className="dark:stroke-slate-500"
          />

          {/* 5 Ergonomic Fingers */}
          {vectorHandFingersData.map((f) => {
            const isActive = activeFinger === f.id;
            return (
              <g key={f.id}>
                {/* Finger Body Path */}
                <path
                  d={f.d}
                  fill={isActive ? f.activeColor : "url(#fingerIdleGrad)"}
                  stroke={isActive ? "#b45309" : "#64748b"}
                  strokeWidth={isActive ? "2.8" : "2"}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter={isActive ? "url(#handGlow)" : undefined}
                  className={`transition-all duration-150 ${
                    isActive
                      ? "animate-pulse"
                      : "dark:fill-[url(#fingerIdleGradDark)] dark:stroke-slate-600"
                  }`}
                >
                  <title>{isKhmer ? f.nameKm : f.nameEn}</title>
                </path>

                {/* Fingertip Touch Indicator */}
                {isActive ? (
                  <>
                    <circle
                      cx={f.tip.x}
                      cy={f.tip.y}
                      r="9"
                      fill={f.color}
                      opacity="0.65"
                      className="animate-ping"
                    />
                    <circle
                      cx={f.tip.x}
                      cy={f.tip.y}
                      r="6.5"
                      fill={f.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </>
                ) : (
                  <circle
                    cx={f.tip.x}
                    cy={f.tip.y}
                    r="4"
                    fill={f.color}
                    opacity="0.85"
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="dark:stroke-slate-800"
                  />
                )}
              </g>
            );
          })}

          {/* Wrist Base Indicator Curve */}
          <path
            d="M 32,205 C 50,212 82,212 98,205"
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
            strokeLinecap="round"
            className="dark:stroke-slate-600"
          />
        </svg>
      </div>

      {/* Dynamic Active Finger Status Pill */}
      <div className="w-full pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-center">
        {activeFingerObj ? (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 shadow-sm animate-pulse">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: activeFingerObj.color }}
            />
            <span>{fingerLabel}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>{fingerLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
});

export default function VirtualKeyboard({
  compact = false,
  hasError = false,
  language = "km",
  nextText = "",
  onFocusRequest,
  session = false,
}) {
  const preferences = useAuthStore((state) => state.user?.preferences);
  const soundEnabled = preferences?.soundEnabled !== false;
  const soundStyle = preferences?.soundStyle ?? "soft";
  const soundVolume = preferences?.soundVolume ?? 0.35;
  const showHandGuide = preferences?.handGuide !== false;
  const words = copy[language === "km" ? "km" : "en"];

  const noticeTimerRef = useRef(null);
  const [showNotice, setShowNotice] = useState(false);
  const [pressedCode, setPressedCode] = useState("");
  const [activeShiftCode, setActiveShiftCode] = useState("");
  const [activeAltGrCode, setActiveAltGrCode] = useState("");

  const nextKey = useMemo(
    () => findKeyForOutput(language, nextText),
    [language, nextText]
  );
  const preferredShiftCode = getPreferredShiftCode(nextKey);
  const preferredAltGrCode = getPreferredAltGrCode(nextKey);

  // Active finger calculation for Left & Right hands
  const assignment = getFingerAssignment(nextKey.code);
  const isSpace = nextKey.code === "Space";

  let leftFinger = "";
  let rightFinger = "";

  if (isSpace) {
    rightFinger = "thumb";
    if (nextKey.shifted) {
      leftFinger = "pinky";
    }
  } else if (assignment) {
    if (assignment.hand === "left") {
      leftFinger = assignment.finger;
      if (nextKey.shifted) {
        rightFinger = "pinky"; // Opposite Shift (ShiftRight)
      } else if (nextKey.altGr) {
        rightFinger = "thumb"; // AltGr
      }
    } else if (assignment.hand === "right") {
      rightFinger = assignment.finger;
      if (nextKey.shifted) {
        leftFinger = "pinky"; // Opposite Shift (ShiftLeft)
      } else if (nextKey.altGr) {
        rightFinger = "thumb"; // AltGr
      }
    }
  }

  useEffect(() => {
    function press(event) {
      if (
        event.repeat ||
        event.isComposing ||
        ["Dead", "Process", "Unidentified"].includes(event.key)
      )
        return;
      setPressedCode(event.code);
      if (event.key === "Shift") {
        setActiveShiftCode(event.code);
        setActiveAltGrCode("");
      }
      if (event.key === "AltGraph" || event.code === "AltRight") {
        setActiveAltGrCode(event.code);
        setActiveShiftCode("");
      }
      playKeyboardSound({
        enabled: soundEnabled,
        key: event.key,
        code: event.code,
        style: soundStyle,
        volume: soundVolume,
      });
    }

    function release(event) {
      setPressedCode((current) => (current === event.code ? "" : current));
      if (event.key === "Shift")
        setActiveShiftCode((current) => (current === event.code ? "" : current));
      if (event.key === "AltGraph" || event.code === "AltRight")
        setActiveAltGrCode((current) => (current === event.code ? "" : current));
    }

    function clear() {
      setPressedCode("");
      setActiveShiftCode("");
      setActiveAltGrCode("");
    }

    window.addEventListener("keydown", press);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", press);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", clear);
    };
  }, [soundEnabled, soundStyle, soundVolume]);

  const handleKeyboardClick = (e) => {
    e.preventDefault();
    onFocusRequest?.();
    setShowNotice(true);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setShowNotice(false), 2400);
  };

  const promptSymbol = nextKey.code === "Space"
    ? "Space"
    : nextKey.output || nextKey.code.replace(/^Key|^Digit/, "");
  const promptKey = nextKey.code
    ? `${nextKey.shifted ? "⇧ + " : nextKey.altGr ? "AltGr + " : ""}${promptSymbol}`
    : "OK";

  return (
    <section
      className={`snp-keyboard-shell relative select-none ${
        compact ? "snp-keyboard-shell-compact" : ""
      } ${session ? "snp-keyboard-session" : ""}`}
      aria-label={`${language === "km" ? "Khmer NIDA" : "English"} learning keyboard`}
      onClick={handleKeyboardClick}
      onMouseDown={(e) => {
        e.preventDefault();
        onFocusRequest?.();
      }}
    >
      {/* Physical Keyboard protection notice */}
      {showNotice && (
        <div className="absolute inset-x-4 top-2 z-30 flex items-center justify-center pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-950 px-4 py-2.5 text-xs font-black shadow-xl backdrop-blur-sm border border-emerald-500/50">
            <LuKeyboard size={18} className="text-[#52c41a]" />
            <span>
              {language === "km"
                ? "សូមវាយដោយប្រើក្ដារចុចពិតប្រាកដ (Physical Keyboard) មិនមែនចុច Mouse ទេ"
                : "Physical Keyboard Required: Please press keys on your physical keyboard to practice typing"}
            </span>
          </div>
        </div>
      )}

      {/* Header Info & Target Prompt */}
      <div className="snp-keyboard-header">
        <div className="min-w-0">
          <p className="snp-keyboard-title">{words.title}</p>
          <p className="snp-keyboard-help">{words.help}</p>
        </div>
        <div
          className={`snp-next-key-prompt ${hasError ? "is-error" : ""}`}
          aria-live="polite"
        >
          <span>{nextKey.code ? words.next : words.ready}</span>
          <b>{promptKey}</b>
          {nextKey.output && (
            <i>→ {displayOutput(nextKey.output, language, nextKey.shifted)}</i>
          )}
        </div>
        <div className="snp-keyboard-legend">
          <span>
            <i className="bg-amber-400 border-amber-500" />
            {words.nextLegend}
          </span>
          {nextKey.shifted && (
            <span>
              <i className="bg-emerald-400 border-emerald-500" />
              {language === "km" ? "កាន់ Shift" : "Hold Shift"}
            </span>
          )}
          <span>
            <i className="bg-[#52c41a] border-emerald-600" />
            {words.pressedLegend}
          </span>
        </div>
      </div>

      {/* Main Unified Row: Left Hand | Keyboard | Right Hand */}
      <div className="snp-keyboard-scroll">
        <div className="flex items-center justify-center gap-3 sm:gap-6 min-w-[960px] mx-auto py-2">
          {/* Left Hand Vector (on Left side) */}
          {showHandGuide && (
            <div className="shrink-0 flex items-center justify-center">
              <VectorHand
                activeFinger={leftFinger}
                hand="left"
                language={language}
              />
            </div>
          )}

          {/* Virtual Keyboard in Center */}
          <div className={`snp-keyboard flex-1 ${compact ? "snp-keyboard-compact" : ""}`}>
            {fullKeyboardRows.map((row, rowIndex) => (
              <div
                className={`snp-keyboard-row ${
                  rowIndex === fullKeyboardRows.length - 1 ? "snp-keyboard-space-row" : ""
                }`}
                key={rowIndex}
              >
                {row.map((item, keyIndex) => {
                  const isTargetKey = item.code === nextKey.code;
                  const isShiftModifier =
                    item.code === preferredShiftCode && nextKey.shifted;
                  const isAltGrModifier =
                    item.code === preferredAltGrCode && nextKey.altGr;
                  const isNext =
                    isTargetKey || isShiftModifier || isAltGrModifier;
                  const isPressed =
                    item.code === pressedCode ||
                    item.code === activeShiftCode ||
                    item.code === activeAltGrCode;

                  let targetQuadrant = null;
                  if (isTargetKey) {
                    if (nextKey.shifted) {
                      targetQuadrant = "topRight";
                    } else if (nextKey.altGr) {
                      targetQuadrant = "topLeft";
                    } else {
                      targetQuadrant = "bottomRight";
                    }
                  }

                  return (
                    <KeyboardKey
                      hasError={hasError && isTargetKey}
                      isAltGrModifier={isAltGrModifier}
                      isNext={isNext}
                      isPressed={isPressed}
                      isShiftModifier={isShiftModifier}
                      isTargetKey={isTargetKey}
                      item={item}
                      key={`${item.code}-${keyIndex}`}
                      language={language}
                      targetQuadrant={targetQuadrant}
                    />
                  );
                })}
              </div>
            ))}
          </div>

          {/* Right Hand Vector (on Right side) */}
          {showHandGuide && (
            <div className="shrink-0 flex items-center justify-center">
              <VectorHand
                activeFinger={rightFinger}
                hand="right"
                language={language}
              />
            </div>
          )}
        </div>
      </div>

      {/* Center Instructional Guidance Sentence */}
      {showHandGuide && (
        <div className="mt-2 text-center border-t border-slate-200/80 dark:border-slate-800 pt-2.5">
          <p className="m-0 text-xs font-bold text-slate-700 dark:text-slate-300">
            {words.finger(assignment, nextKey.shifted, nextKey.altGr, nextKey.output)}
          </p>
        </div>
      )}
    </section>
  );
}
