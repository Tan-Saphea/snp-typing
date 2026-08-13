let audioContext;
let noiseBuffer;
let outputNode;

function getAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass({ latencyHint: "interactive" });
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

function getOutputNode(context) {
  if (outputNode) return outputNode;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.knee.value = 14;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.08;
  compressor.connect(context.destination);
  outputNode = compressor;
  return outputNode;
}

function getNoiseBuffer(context) {
  if (noiseBuffer?.sampleRate === context.sampleRate) return noiseBuffer;

  const duration = 0.4;
  noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  let previous = 0;

  for (let index = 0; index < data.length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.28 + white * 0.72;
    data[index] = previous;
  }

  return noiseBuffer;
}

const soundProfiles = {
  soft: {
    airFrequency: 4600,
    airGain: 0.1,
    bodyDuration: 0.085,
    bodyFrequency: 185,
    bodyGain: 0.026,
    bodyType: "triangle",
    clickDuration: 0.052,
    clickFrequency: 2700,
    clickGain: 0.36,
    clickQ: 0.62,
    roomDuration: 0.25,
    roomFrequency: 1900,
    roomGain: 0.035,
    secondaryClick: true,
    secondaryDelay: 0.102,
    secondaryGain: 0.68,
    secondaryPitch: 0.94,
  },
  typewriter: {
    bodyDuration: 0.058,
    bodyFrequency: 112,
    bodyGain: 0.1,
    bodyType: "triangle",
    clickDuration: 0.037,
    clickFrequency: 1750,
    clickGain: 0.27,
    clickQ: 1.15,
    roomDuration: 0.14,
    roomFrequency: 980,
    roomGain: 0.032,
    secondaryClick: true,
    secondaryDelay: 0.018,
    secondaryGain: 0.42,
    secondaryPitch: 1.08,
  },
  bubble: {
    bodyDuration: 0.085,
    bodyFrequency: 430,
    bodyGain: 0.09,
    bodyType: "sine",
    clickDuration: 0.014,
    clickFrequency: 3400,
    clickGain: 0.1,
    clickQ: 0.55,
    upwardPitch: true,
  },
};

function keyVariation(key) {
  const value = [...String(key)].reduce((total, character) => total + character.codePointAt(0), 0);
  return 0.96 + (value % 9) * 0.01;
}

function keyShape(key, style) {
  if (style === "soft") {
    if (key === " ") return { pitch: 0.88, gain: 1.08 };
    if (["Enter", "Backspace"].includes(key)) return { pitch: 0.92, gain: 1.06 };
    if (["Shift", "CapsLock", "Tab"].includes(key)) return { pitch: 0.95, gain: 1.02 };
    return { pitch: 1, gain: 1 };
  }

  if (key === " ") return { pitch: 0.6, gain: 1.18 };
  if (["Enter", "Backspace"].includes(key)) return { pitch: 0.72, gain: 1.1 };
  if (["Shift", "CapsLock", "Tab"].includes(key)) return { pitch: 0.82, gain: 1.02 };
  return { pitch: 1, gain: 1 };
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
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * profile.clickGain * gainScale), when + 0.0015);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  if (airFilter && airGain) {
    airFilter.type = "highpass";
    airFilter.frequency.setValueAtTime(profile.airFrequency * pitch, when);
    airFilter.Q.value = 0.35;
    airGain.gain.setValueAtTime(0.0001, when);
    airGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * profile.airGain * gainScale), when + 0.001);
    airGain.gain.exponentialRampToValueAtTime(0.0001, when + duration * 0.72);
    source.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(output);
  }
  source.start(when, Math.random() * 0.045, duration + 0.005);
  source.stop(when + duration + 0.006);
}

function playKeyBody(context, output, profile, when, level, pitch, gainScale) {
  const oscillator = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const startFrequency = profile.bodyFrequency * pitch;
  const endFrequency = startFrequency * (profile.upwardPitch ? 1.32 : 0.68);

  oscillator.type = profile.bodyType;
  oscillator.frequency.setValueAtTime(startFrequency, when);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, when + profile.bodyDuration);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(profile.upwardPitch ? 1800 : 850, when);
  filter.Q.value = 0.6;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * profile.bodyGain * gainScale), when + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + profile.bodyDuration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  oscillator.start(when);
  oscillator.stop(when + profile.bodyDuration + 0.005);
}

function playRoomTail(context, output, profile, when, level, pitch, gainScale) {
  if (!profile.roomDuration || !profile.roomGain) return;

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = getNoiseBuffer(context);
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(profile.roomFrequency * pitch, when);
  filter.frequency.exponentialRampToValueAtTime(profile.roomFrequency * pitch * 0.72, when + profile.roomDuration);
  filter.Q.value = 0.45;
  gain.gain.setValueAtTime(Math.max(0.0001, level * profile.roomGain * gainScale), when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + profile.roomDuration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(output);
  source.start(when, Math.random() * 0.006, profile.roomDuration);
  source.stop(when + profile.roomDuration + 0.005);
}

export function playKeyboardSound({ enabled = true, key = "", style = "soft", volume = 0.35 } = {}) {
  if (!enabled || volume <= 0 || typeof window === "undefined") return;

  try {
    const context = getAudioContext();
    if (!context) return;

    const profile = soundProfiles[style] ?? soundProfiles.soft;
    const output = getOutputNode(context);
    const shape = keyShape(key, style);
    const pitch = shape.pitch * keyVariation(key);
    const level = Math.sqrt(Math.min(Math.max(Number(volume), 0), 1));
    const now = context.currentTime + 0.002;

    playNoiseImpact(context, output, profile, now, level, pitch, shape.gain);
    playKeyBody(context, output, profile, now, level, pitch, shape.gain);
    playRoomTail(context, output, profile, now + 0.004, level, pitch, shape.gain);
    if (profile.secondaryClick) {
      playNoiseImpact(
        context,
        output,
        profile,
        now + profile.secondaryDelay,
        level,
        pitch * profile.secondaryPitch,
        shape.gain * profile.secondaryGain,
      );
    }
  } catch {
    // Audio feedback must never interrupt a typing lesson.
  }
}

export function previewKeyboardSound(options = {}) {
  if (typeof window === "undefined") return;
  ["A", "S", "D", "F", " "].forEach((key, index) => {
    window.setTimeout(() => playKeyboardSound({ ...options, key }), index * 82);
  });
}
