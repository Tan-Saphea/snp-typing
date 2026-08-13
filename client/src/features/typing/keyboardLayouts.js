export const ENGLISH_OUTPUTS = {
  Backquote: ["`", "~"], Digit1: ["1", "!"], Digit2: ["2", "@"], Digit3: ["3", "#"], Digit4: ["4", "$"],
  Digit5: ["5", "%"], Digit6: ["6", "^"], Digit7: ["7", "&"], Digit8: ["8", "*"], Digit9: ["9", "("], Digit0: ["0", ")"],
  Minus: ["-", "_"], Equal: ["=", "+"], BracketLeft: ["[", "{"], BracketRight: ["]", "}"], Backslash: ["\\", "|"],
  Semicolon: [";", ":"], Quote: ["'", "\""], Comma: [",", "<"], Period: [".", ">"], Slash: ["/", "?"], Space: [" "], Enter: ["\n"],
};

for (const letter of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") ENGLISH_OUTPUTS[`Key${letter}`] = [letter.toLowerCase(), letter];

// Unicode CLDR's Khmer NIDA layout. Each entry is [base, shift, AltGr]. Keeping the
// layout in one data map makes labels, target highlighting, and virtual input
// agree with one another.
export const KHMER_OUTPUTS = {
  Backquote: ["«", "»", "‍"], Digit1: ["១", "!", "‌"], Digit2: ["២", "ៗ", "@"], Digit3: ["៣", "\"", "៑"], Digit4: ["៤", "៛", "$"],
  Digit5: ["៥", "%", "€"], Digit6: ["៦", "៍", "៙"], Digit7: ["៧", "័", "៚"], Digit8: ["៨", "៏", "*"], Digit9: ["៩", "(", "{"], Digit0: ["០", ")", "}"],
  Minus: ["ឥ", "៌", "×"], Equal: ["ឲ", "=", "៎"],
  KeyQ: ["ឆ", "ឈ"], KeyW: ["ឹ", "ឺ"], KeyE: ["េ", "ែ", "ឯ"], KeyR: ["រ", "ឬ", "ឫ"], KeyT: ["ត", "ទ"],
  KeyY: ["យ", "ួ"], KeyU: ["ុ", "ូ"], KeyI: ["ិ", "ី", "ឦ"], KeyO: ["ោ", "ៅ", "ឱ"], KeyP: ["ផ", "ភ", "ឰ"],
  BracketLeft: ["ៀ", "ឿ", "ឩ"], BracketRight: ["ឪ", "ឧ", "ឳ"],
  KeyA: ["ា", "ាំ"], KeyS: ["ស", "ៃ"], KeyD: ["ដ", "ឌ"], KeyF: ["ថ", "ធ"], KeyG: ["ង", "អ"],
  KeyH: ["ហ", "ះ"], KeyJ: ["្", "ញ"], KeyK: ["ក", "គ"], KeyL: ["ល", "ឡ"], Semicolon: ["ើ", "ោះ", "៖"],
  Quote: ["់", "៉", "ៈ"], Backslash: ["ឮ", "ឭ", "\\"],
  KeyZ: ["ឋ", "ឍ"], KeyX: ["ខ", "ឃ"], KeyC: ["ច", "ជ"], KeyV: ["វ", "េះ"], KeyB: ["ប", "ព"],
  KeyN: ["ន", "ណ"], KeyM: ["ម", "ំ"], Comma: ["ុំ", "ុះ", ","], Period: ["។", "៕", "."], Slash: ["៊", "?", "/"],
  Space: [" "], Enter: ["\n"],
};

export function getKeyboardOutput(language, code, modifier = false) {
  const outputs = language === "km" ? KHMER_OUTPUTS[code] : ENGLISH_OUTPUTS[code];
  if (!outputs) return "";
  const outputIndex = modifier === "altGr" ? 2 : modifier === true || modifier === "shift" ? 1 : 0;
  return outputs[outputIndex] ?? outputs[0] ?? "";
}

export function findKeyForOutput(language, remainingText) {
  if (!remainingText) return { altGr: false, code: "", shifted: false, output: "" };
  const layout = language === "km" ? KHMER_OUTPUTS : ENGLISH_OUTPUTS;
  const candidates = [];

  for (const [code, outputs] of Object.entries(layout)) {
    outputs.forEach((output, index) => {
      if (output && remainingText.startsWith(output)) {
        candidates.push({ altGr: index === 2, code, shifted: index === 1, output });
      }
    });
  }

  candidates.sort((left, right) => [...right.output].length - [...left.output].length || Number(left.shifted) - Number(right.shifted));
  return candidates[0] ?? { altGr: false, code: "", shifted: false, output: "" };
}
