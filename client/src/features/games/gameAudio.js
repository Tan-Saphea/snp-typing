const SOUND_PATHS = {
  mine_hit: "/sounds/games/mine_hit.wav",
  diamond_ping: "/sounds/games/diamond_ping.wav",
  tnt_explode: "/sounds/games/tnt_explode.wav",
  jump_bounce: "/sounds/games/jump_bounce.wav",
  blox_coin: "/sounds/games/blox_coin.wav",
  speed_boost: "/sounds/games/speed_boost.wav",
  magic_zap: "/sounds/games/magic_zap.wav",
  ghost_caught: "/sounds/games/ghost_caught.wav",
  freeze_spell: "/sounds/games/freeze_spell.wav",
  level_up: "/sounds/games/level_up.wav",
};

const audioCache = new Map();
let soundMuted = false;

export function setGameSoundMuted(muted) {
  soundMuted = Boolean(muted);
}

export function isGameSoundMuted() {
  return soundMuted;
}

export function playGameSound(name, volume = 0.5) {
  if (soundMuted || typeof window === "undefined" || !SOUND_PATHS[name]) return;

  try {
    let pool = audioCache.get(name);
    if (!pool) {
      pool = [];
      audioCache.set(name, pool);
    }

    // Reuse an idle audio instance or create one up to 4 instances
    let audio = pool.find((a) => a.paused || a.ended);
    if (!audio) {
      if (pool.length < 4) {
        audio = new Audio(SOUND_PATHS[name]);
        pool.push(audio);
      } else {
        audio = pool[0]; // Recycle oldest
      }
    }

    audio.volume = Math.max(0, Math.min(1, volume));
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Suppress browser autoplay restrictions silently
      });
    }
  } catch {
    // Audio playback error tolerated in test or restricted environments
  }
}
