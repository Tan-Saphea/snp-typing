#!/usr/bin/env python3
"""
Sound Synthesizer for SNP Typing Kids Games
Synthesizes procedural 44.1kHz 16-bit PCM WAV sound effects using only the Python standard library.
Games supported:
1. Minecraft Block Miner (mine_hit.wav, diamond_ping.wav, tnt_explode.wav)
2. Roblox Blox Obby (jump_bounce.wav, blox_coin.wav, speed_boost.wav)
3. Ghost Catcher (magic_zap.wav, ghost_caught.wav, freeze_spell.wav)
"""

import math
import os
import struct
import wave

SAMPLE_RATE = 44100

def write_wav(filename: str, samples: list[float]):
    """Writes a list of normalized float samples (-1.0 to 1.0) to a 16-bit mono WAV file."""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, "wb") as wav_file:
        wav_file.setnchannels(1)        # mono
        wav_file.setsampwidth(2)       # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        
        frames = bytearray()
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            int_val = int(clamped * 32767.0)
            frames.extend(struct.pack("<h", int_val))
        
        wav_file.writeframes(frames)
    print(f"Generated {filename} ({len(samples)} samples, {len(samples)/SAMPLE_RATE:.2f}s)")


def synthesize_mine_hit() -> list[float]:
    """Minecraft pickaxe striking stone / ore: punchy transient click + gritty resonance."""
    duration = 0.12
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    rand_val = 12345
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        envelope = math.exp(-35.0 * t)
        freq = 750.0 - 590.0 * (t / duration)
        sine = math.sin(2.0 * math.pi * freq * t)
        
        rand_val = (rand_val * 1103515245 + 12345) & 0x7FFFFFFF
        noise = (rand_val / 0x7FFFFFFF) * 2.0 - 1.0
        
        sample = (0.65 * sine + 0.35 * noise) * envelope
        samples.append(sample)
        
    return samples


def synthesize_diamond_ping() -> list[float]:
    """Minecraft diamond ore shatter & gem pickup: bright crystalline arpeggio."""
    duration = 0.45
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    notes = [1046.5, 1318.5, 1567.98, 2093.0]
    note_step = 0.06
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        mix = 0.0
        
        for idx, freq in enumerate(notes):
            start_t = idx * note_step
            if t >= start_t:
                dt = t - start_t
                env = math.exp(-14.0 * dt)
                tone = math.sin(2.0 * math.pi * freq * dt) + 0.3 * math.sin(4.0 * math.pi * freq * dt)
                mix += tone * env
                
        samples.append(mix * 0.45)
        
    return samples


def synthesize_tnt_explode() -> list[float]:
    """Minecraft TNT blast: heavy punchy sub-bass drop + explosive distorted shockwave decay."""
    duration = 0.55
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    rand_val = 54321
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env_boom = math.exp(-7.0 * t)
        env_noise = math.exp(-11.0 * t)
        
        # Sub-bass pitch sweep (130Hz down to 32Hz)
        bass_freq = 130.0 * math.exp(-12.0 * t) + 32.0
        sub_bass = math.sin(2.0 * math.pi * bass_freq * t)
        
        # Gritty rumble noise
        rand_val = (rand_val * 1103515245 + 12345) & 0x7FFFFFFF
        noise = (rand_val / 0x7FFFFFFF) * 2.0 - 1.0
        
        # Saturated overdrive distortion
        raw = 0.75 * sub_bass * env_boom + 0.65 * noise * env_noise
        sample = math.tanh(raw * 1.5) * 0.85
        samples.append(sample)
        
    return samples


def synthesize_jump_bounce() -> list[float]:
    """Roblox obby avatar jumping on trampoline / platform: rising spring frequency sweep."""
    duration = 0.18
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (t / duration)) ** 0.5 * math.exp(-6.0 * t)
        freq = 180.0 + 460.0 * (t / duration) ** 1.3
        sine = math.sin(2.0 * math.pi * freq * t)
        sub = math.sin(math.pi * freq * t)
        
        samples.append((0.7 * sine + 0.3 * sub) * env)
        
    return samples


def synthesize_blox_coin() -> list[float]:
    """Roblox Blox Coin collection ding: cheerful bright dual chime."""
    duration = 0.32
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        sample = 0.0
        
        if t < 0.15:
            env1 = math.exp(-18.0 * t)
            sample += math.sin(2.0 * math.pi * 987.77 * t) * env1
            
        if t >= 0.08:
            dt2 = t - 0.08
            env2 = math.exp(-12.0 * dt2)
            tone2 = math.sin(2.0 * math.pi * 1318.51 * dt2) + 0.25 * math.sin(2.0 * math.pi * 2637.02 * dt2)
            sample += tone2 * env2
            
        samples.append(sample * 0.5)
        
    return samples


def synthesize_speed_boost() -> list[float]:
    """Roblox turbo speed boost: supersonic rising energy whoosh."""
    duration = 0.35
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (t / duration)) ** 0.8
        # Rising whoosh 220Hz to 1200Hz
        freq = 220.0 + 980.0 * (t / duration) ** 2.0
        sine = math.sin(2.0 * math.pi * freq * t)
        harmonic = math.sin(4.0 * math.pi * freq * t) * 0.3
        samples.append((sine + harmonic) * env * 0.5)
        
    return samples


def synthesize_magic_zap() -> list[float]:
    """Ghost Catcher vacuum / bubble laser beam zap: sci-fi modulated energy beam."""
    duration = 0.14
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        env = math.sin(math.pi * (t / duration)) ** 0.6
        mod = 60.0 * math.sin(2.0 * math.pi * 45.0 * t)
        carrier = math.sin(2.0 * math.pi * (480.0 + mod) * t)
        spark = math.sin(2.0 * math.pi * 1440.0 * t) * 0.2
        samples.append((carrier + spark) * env * 0.6)
        
    return samples


def synthesize_ghost_caught() -> list[float]:
    """Ghost safely caught in bubble: friendly whimsical capture chime."""
    duration = 0.40
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    chords = [698.46, 880.00, 1046.50, 1318.51]
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        mix = 0.0
        
        for idx, freq in enumerate(chords):
            start_t = idx * 0.05
            if t >= start_t:
                dt = t - start_t
                env = math.exp(-10.0 * dt)
                mix += (math.sin(2.0 * math.pi * freq * dt) + 0.2 * math.sin(4.0 * math.pi * freq * dt)) * env
                
        samples.append(mix * 0.35)
        
    return samples


def synthesize_freeze_spell() -> list[float]:
    """Ghost Catcher freeze spell: crystalline ice frost chime."""
    duration = 0.48
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    ice_tones = [1318.51, 1567.98, 2093.00, 2637.02]  # E6, G6, C7, E7
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        mix = 0.0
        
        for idx, freq in enumerate(ice_tones):
            start_t = idx * 0.06
            if t >= start_t:
                dt = t - start_t
                env = math.exp(-11.0 * dt)
                shimmer = math.sin(2.0 * math.pi * 30.0 * dt) * 15.0
                tone = math.sin(2.0 * math.pi * (freq + shimmer) * dt)
                mix += tone * env
                
        samples.append(mix * 0.4)
        
    return samples


def synthesize_level_up() -> list[float]:
    """Arcade Level Up fanfare: bright, triumphant ascending arpeggio with shimmering chime harmonics."""
    duration = 0.75
    total_samples = int(SAMPLE_RATE * duration)
    samples = []
    # C major triumphant progression: C4, E4, G4, C5, E5, G5, C6 (octave peak)
    notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]
    note_step = 0.08
    
    for i in range(total_samples):
        t = i / SAMPLE_RATE
        mix = 0.0
        
        for idx, freq in enumerate(notes):
            start_t = idx * note_step
            if t >= start_t:
                dt = t - start_t
                # Longer sustain for the final climax note
                decay_rate = 6.0 if idx == len(notes) - 1 else 12.0
                env = math.exp(-decay_rate * dt)
                
                # Sparkling chime vibrato/shimmer
                shimmer = math.sin(2.0 * math.pi * 18.0 * dt) * 6.0
                tone = math.sin(2.0 * math.pi * (freq + shimmer) * dt)
                harmonic2 = 0.35 * math.sin(4.0 * math.pi * freq * dt)
                harmonic3 = 0.15 * math.sin(6.0 * math.pi * freq * dt)
                mix += (tone + harmonic2 + harmonic3) * env
                
        samples.append(mix * 0.32)
        
    return samples


def main():
    target_dir = os.path.join(os.path.dirname(__file__), "..", "client", "public", "sounds", "games")
    os.makedirs(target_dir, exist_ok=True)
    
    effects = [
        ("mine_hit.wav", synthesize_mine_hit()),
        ("diamond_ping.wav", synthesize_diamond_ping()),
        ("tnt_explode.wav", synthesize_tnt_explode()),
        ("jump_bounce.wav", synthesize_jump_bounce()),
        ("blox_coin.wav", synthesize_blox_coin()),
        ("speed_boost.wav", synthesize_speed_boost()),
        ("magic_zap.wav", synthesize_magic_zap()),
        ("ghost_caught.wav", synthesize_ghost_caught()),
        ("freeze_spell.wav", synthesize_freeze_spell()),
        ("level_up.wav", synthesize_level_up()),
    ]
    
    print(f"Synthesizing {len(effects)} sound effects into {target_dir}...")
    for filename, samples in effects:
        full_path = os.path.join(target_dir, filename)
        write_wav(full_path, samples)
    print("Sound synthesis complete!")


if __name__ == "__main__":
    main()
