import { useAuthStore } from "../../stores/authStore.js";

let audioContext = null;
let noiseBuffer = null;
let outputNode = null;
let lastKeyTime = 0;
let lastKeyCode = "";

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass({ latencyHint: "interactive" });
  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

if (typeof window !== "undefined") {
  const unlockAudio = () => {
    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }
  };
  window.addEventListener("pointerdown", unlockAudio, { once: true, passive: true });
  window.addEventListener("keydown", unlockAudio, { once: true, passive: true });
}

function getOutputNode(context) {
  if (outputNode) return outputNode;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 12;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.06;
  compressor.connect(context.destination);
  outputNode = compressor;
  return outputNode;
}

function getNoiseBuffer(context) {
  if (noiseBuffer?.sampleRate === context.sampleRate) return noiseBuffer;

  const duration = 0.5;
  noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let previous = 0;

  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    // Velvet pink-filtered noise for rich, organic acoustic texture
    previous = previous * 0.32 + white * 0.68;
    data[index] = previous;
  }

  return noiseBuffer;
}

export const soundProfiles = {
  // 1. Crisp Tactile / Scissor Switch (Default: Modern MacBook / ThinkPad / Lubed Brown)
  soft: {
    name: "Crisp Keyboard",
    airFrequency: 5200,
    airGain: 0.12,
    bodyDuration: 0.038,
    bodyFrequency: 210,
    bodyEndFrequency: 125,
    bodyGain: 0.048,
    bodyType: "triangle",
    clickDuration: 0.016,
    clickFrequency: 3600,
    clickGain: 0.42,
    clickQ: 1.25,
    roomDuration: 0.075,
    roomFrequency: 1350,
    roomGain: 0.026,
    secondaryClick: true,
    secondaryDelay: 0.036,
    secondaryGain: 0.34,
    secondaryPitch: 1.05,
  },

  // 2. Deep Thock (Custom Mechanical Keyboard: Lubed Linear / Gasket Mounted / ASMR)
  thock: {
    name: "Deep Thock",
    airFrequency: 3200,
    airGain: 0.05,
    bodyDuration: 0.056,
    bodyFrequency: 135,
    bodyEndFrequency: 82,
    bodyGain: 0.088,
    bodyType: "sine",
    clickDuration: 0.018,
    clickFrequency: 1750,
    clickGain: 0.3,
    clickQ: 0.85,
    roomDuration: 0.095,
    roomFrequency: 680,
    roomGain: 0.045,
    secondaryClick: true,
    secondaryDelay: 0.042,
    secondaryGain: 0.24,
    secondaryPitch: 0.95,
  },

  // 3. Clicky Blue Switch (Cherry MX Blue / Kailh Box White: Dual-stage tactile snap)
  mechanical: {
    name: "Clicky Blue Switch",
    airFrequency: 6400,
    airGain: 0.18,
    bodyDuration: 0.044,
    bodyFrequency: 240,
    bodyEndFrequency: 140,
    bodyGain: 0.052,
    bodyType: "triangle",
    clickDuration: 0.014,
    clickFrequency: 4300,
    clickGain: 0.48,
    clickQ: 1.7,
    roomDuration: 0.07,
    roomFrequency: 2100,
    roomGain: 0.032,
    secondaryClick: true,
    secondaryDelay: 0.03,
    secondaryGain: 0.52,
    secondaryPitch: 1.14,
  },

  // 4. Vintage Typewriter (Heavy metal striker bar + platen roller impact)
  typewriter: {
    name: "Classic Typewriter",
    airFrequency: 4800,
    airGain: 0.16,
    bodyDuration: 0.065,
    bodyFrequency: 115,
    bodyEndFrequency: 65,
    bodyGain: 0.095,
    bodyType: "triangle",
    clickDuration: 0.026,
    clickFrequency: 2300,
    clickGain: 0.44,
    clickQ: 1.9,
    roomDuration: 0.12,
    roomFrequency: 920,
    roomGain: 0.052,
    secondaryClick: true,
    secondaryDelay: 0.028,
    secondaryGain: 0.58,
    secondaryPitch: 1.15,
  },

  // 5. Bubble Pop (Playful, cheerful liquid pop with upward pitch ramp)
  bubble: {
    name: "Bubble Pop",
    airFrequency: 4800,
    airGain: 0.08,
    bodyDuration: 0.062,
    bodyFrequency: 440,
    bodyEndFrequency: 880,
    bodyGain: 0.11,
    bodyType: "sine",
    clickDuration: 0.012,
    clickFrequency: 3600,
    clickGain: 0.14,
    clickQ: 0.6,
    roomDuration: 0.04,
    roomFrequency: 1200,
    roomGain: 0.02,
    upwardPitch: true,
  },
};

export function getPanForKey(code = "", key = "") {
  const c = String(code || key).toUpperCase();
  // Far left column
  if (["TAB", "CAPSLOCK", "SHIFTLEFT", "KEYQ", "KEYA", "KEYZ", "DIGIT1", "DIGIT2", "BACKQUOTE", "ESCAPE"].includes(c)) return -0.28;
  // Mid left column
  if (["KEYW", "KEYE", "KEYS", "KEYD", "KEYX", "KEYC", "DIGIT3", "DIGIT4"].includes(c)) return -0.16;
  // Center left
  if (["KEYR", "KEYF", "KEYV", "DIGIT5"].includes(c)) return -0.06;
  // Center
  if (["KEYT", "KEYG", "KEYB", "DIGIT6", "SPACE"].includes(c) || key === " ") return 0;
  // Center right
  if (["KEYY", "KEYH", "KEYN", "DIGIT7"].includes(c)) return 0.06;
  // Mid right
  if (["KEYU", "KEYI", "KEYJ", "KEYK", "KEYM", "DIGIT8", "DIGIT9"].includes(c)) return 0.16;
  // Far right column
  if (["KEYO", "KEYP", "KEYL", "ENTER", "BACKSPACE", "SHIFTRIGHT", "DIGIT0", "MINUS", "EQUAL", "BRACKETLEFT", "BRACKETRIGHT", "SEMICOLON", "QUOTE", "SLASH", "BACKSLASH"].includes(c)) return 0.28;
  return 0;
}

function keyVariation(key = "", code = "") {
  const str = String(code || key || "key");
  const hash = [...str].reduce((total, character) => total + character.codePointAt(0), 0);
  const pitchVar = 0.98 + (hash % 5) * 0.01; // +/- 2%
  const gainVar = 0.97 + (hash % 7) * 0.01;  // +/- 3%
  return { pitchVar, gainVar };
}

function keyShape(key = "", code = "") {
  const isSpace = key === " " || code === "Space";
  const isEnterOrBack = ["Enter", "Backspace"].includes(key) || ["Enter", "Backspace"].includes(code);
  const isModifier = ["Shift", "CapsLock", "Tab", "Control", "Alt"].includes(key) ||
    ["ShiftLeft", "ShiftRight", "CapsLock", "Tab", "ControlLeft", "ControlRight"].includes(code);

  if (isSpace) {
    return {
      pitch: 0.64,
      gain: 1.25,
      bodyGain: 1.35,
      roomGain: 1.35,
      snapPitch: 0.76,
    };
  }
  if (isEnterOrBack) {
    return {
      pitch: 0.78,
      gain: 1.15,
      bodyGain: 1.22,
      roomGain: 1.15,
      snapPitch: 0.86,
    };
  }
  if (isModifier) {
    return {
      pitch: 0.88,
      gain: 1.05,
      bodyGain: 1.1,
      roomGain: 1.05,
      snapPitch: 0.94,
    };
  }
  return {
    pitch: 1.0,
    gain: 1.0,
    bodyGain: 1.0,
    roomGain: 1.0,
    snapPitch: 1.0,
  };
}

function playNoiseImpact(context, output, profile, when, level, pitch, gainScale = 1) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const airFilter = profile.airGain ? context.createBiquadFilter() : null;
  const airGain = profile.airGain ? context.createGain() : null;
  const duration = profile.clickDuration;

  source.buffer = getNoiseBuffer(context);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(profile.clickFrequency * pitch, when);
  filter.Q.setValueAtTime(profile.clickQ, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * profile.clickGain * gainScale), when + 0.001);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);

  if (airFilter && airGain) {
    airFilter.type = "highpass";
    airFilter.frequency.setValueAtTime(profile.airFrequency * pitch, when);
    airFilter.Q.value = 0.4;
    airGain.gain.setValueAtTime(0.0001, when);
    airGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * profile.airGain * gainScale), when + 0.001);
    airGain.gain.exponentialRampToValueAtTime(0.0001, when + duration * 0.75);
    source.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(output);
  }

  source.start(when, Math.random() * 0.05, duration + 0.005);
  source.stop(when + duration + 0.006);
}

function playKeyBody(context, output, profile, when, level, pitch, gainScale = 1) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const startFrequency = profile.bodyFrequency * pitch;
  const endFrequency = (profile.bodyEndFrequency || (startFrequency * (profile.upwardPitch ? 1.4 : 0.62))) * pitch;

  oscillator.type = profile.bodyType;
  oscillator.frequency.setValueAtTime(startFrequency, when);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), when + profile.bodyDuration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.upwardPitch ? 1800 : 900, when);
  filter.Q.value = 0.7;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * profile.bodyGain * gainScale), when + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + profile.bodyDuration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  oscillator.start(when);
  oscillator.stop(when + profile.bodyDuration + 0.005);
}

function playRoomTail(context, output, profile, when, level, pitch, gainScale = 1) {
  if (!profile.roomDuration || !profile.roomGain) return;

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = getNoiseBuffer(context);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(profile.roomFrequency * pitch, when);
  filter.frequency.exponentialRampToValueAtTime(Math.max(50, profile.roomFrequency * pitch * 0.75), when + profile.roomDuration);
  filter.Q.value = 0.5;
  gain.gain.setValueAtTime(Math.max(0.0001, level * profile.roomGain * gainScale), when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + profile.roomDuration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start(when, Math.random() * 0.008, profile.roomDuration);
  source.stop(when + profile.roomDuration + 0.005);
}

export function playKeyboardSound(options = {}) {
  let { enabled, key = "", code = "", style, volume } = options;

  // Resolve preferences from authStore if not explicitly specified
  if (enabled === undefined || style === undefined || volume === undefined) {
    try {
      const prefs = useAuthStore?.getState?.()?.user?.preferences;
      if (enabled === undefined) enabled = prefs?.soundEnabled !== false;
      if (style === undefined) style = prefs?.soundStyle ?? "soft";
      if (volume === undefined) volume = prefs?.soundVolume ?? 0.35;
    } catch {
      if (enabled === undefined) enabled = true;
      if (style === undefined) style = "soft";
      if (volume === undefined) volume = 0.35;
    }
  }

  if (!enabled || volume <= 0 || typeof window === "undefined") return;

  // Deduplication guard: ignore redundant duplicate events within 15ms for the same key code
  const nowMs = performance.now();
  const effectiveCode = code || key || "key";
  if (nowMs - lastKeyTime < 15 && lastKeyCode === effectiveCode) {
    return;
  }
  lastKeyCode = effectiveCode;
  lastKeyTime = nowMs;

  try {
    const context = getAudioContext();
    if (!context) return;

    const profile = soundProfiles[style] ?? soundProfiles.soft;
    const masterOutput = getOutputNode(context);
    const shape = keyShape(key, code);
    const { pitchVar, gainVar } = keyVariation(key, code);
    const pitch = shape.pitch * pitchVar;
    const snapPitch = (shape.snapPitch || shape.pitch) * pitchVar;
    const gainScale = shape.gain * gainVar;
    const level = Math.sqrt(Math.min(Math.max(Number(volume), 0), 1));
    const now = context.currentTime + 0.001;

    // Spatial Stereo Panning
    let keyDestination = masterOutput;
    if (typeof context.createStereoPanner === "function") {
      const panner = context.createStereoPanner();
      panner.pan.value = getPanForKey(code, key);
      panner.connect(masterOutput);
      keyDestination = panner;
    }

    playNoiseImpact(context, keyDestination, profile, now, level, snapPitch, gainScale);
    playKeyBody(context, keyDestination, profile, now, level, pitch, gainScale * (shape.bodyGain || 1));
    playRoomTail(context, keyDestination, profile, now + 0.003, level, pitch, gainScale * (shape.roomGain || 1));

    if (profile.secondaryClick) {
      playNoiseImpact(
        context,
        keyDestination,
        profile,
        now + profile.secondaryDelay,
        level,
        snapPitch * profile.secondaryPitch,
        gainScale * profile.secondaryGain,
      );
    }
  } catch {
    // Audio feedback must never interrupt typing lessons or tests.
  }
}

export function previewKeyboardSound(options = {}) {
  if (typeof window === "undefined") return;
  const sampleSequence = [
    { key: "A", code: "KeyA" },
    { key: "S", code: "KeyS" },
    { key: "D", code: "KeyD" },
    { key: "F", code: "KeyF" },
    { key: " ", code: "Space" },
  ];

  sampleSequence.forEach(({ key, code }, index) => {
    window.setTimeout(() => {
      // Force deduplication bypass by setting lastKeyCode to empty string
      lastKeyCode = "";
      playKeyboardSound({ ...options, key, code });
    }, index * 95);
  });
}
