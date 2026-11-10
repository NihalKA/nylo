"""Synthesize Nylo's UI sounds into assets/sounds/*.wav (original work).

Soothing by design:
- one scale (D-major pentatonic), so any two sounds are consonant;
- a warm "felt kalimba" timbre: harmonic partials only (1x, 2x, 3x), plus a
  slightly detuned second voice for softness;
- soft attacks (no click), a low register (nothing above A5), and a small
  room reverb so each tone fades naturally.

Multi-note sounds use the exact gaps of the matching haptic pattern in
src/haptics.ts, so sound and vibration land together.

Run: python3 scripts/generate-ui-sounds.py
"""
import math
import struct
import wave
from pathlib import Path

RATE = 44100
OUT = Path(__file__).resolve().parent.parent / "assets" / "sounds"

N = {
    "A4": 440.00, "B4": 493.88, "D5": 587.33, "E5": 659.25, "F#5": 739.99,
    "A5": 880.00,
}


def note(freq, start_ms, gain=0.12, decay_ms=140, attack_ms=12, glide=0.0,
         warmth=1.0):
    """One softly struck note: (start_sample, samples)."""
    length = int(RATE * (attack_ms + decay_ms * 5) / 1000)
    partials = [(1.0, 1.0), (2.0, 0.10 * warmth), (3.0, 0.025 * warmth)]
    voices = [(1.0, 1.0), (1.006, 0.35)]  # gentle chorus
    phases = [[0.0] * len(partials) for _ in voices]
    out = []
    for i in range(length):
        ms = i * 1000 / RATE
        # raised-cosine attack: no click
        env = (0.5 - 0.5 * math.cos(math.pi * ms / attack_ms)) if ms < attack_ms \
            else math.exp(-(ms - attack_ms) / decay_ms)
        f = freq * (1 + glide * (1 - math.exp(-ms / 40)))
        sample = 0.0
        for v, (detune, vamp) in enumerate(voices):
            for k, (ratio, amp) in enumerate(partials):
                phases[v][k] += 2 * math.pi * f * detune * ratio / RATE
                # overtones fade faster than the fundamental: soft, round tail
                fade = math.exp(-ms * (ratio - 1) / (decay_ms * 0.8))
                sample += vamp * amp * fade * math.sin(phases[v][k])
        out.append(gain * env * sample / 1.35)
    return int(RATE * start_ms / 1000), out


SOUNDS = {
    "tick": [note(N["F#5"], 0, gain=0.06, decay_ms=35, attack_ms=6)],
    "select": [note(N["A5"], 0, gain=0.05, decay_ms=45, attack_ms=8,
                    warmth=0.6)],
    "button": [note(N["D5"], 0, gain=0.11, decay_ms=90)],
    "card": [note(N["A4"], 0, gain=0.09, decay_ms=150, attack_ms=14),
             note(N["D5"], 0, gain=0.05, decay_ms=150, attack_ms=14,
                  warmth=0.5)],
    "create": [note(N["A4"], 0, gain=0.09, decay_ms=200, attack_ms=12),
               note(N["E5"], 0, gain=0.06, decay_ms=200, attack_ms=12,
                    warmth=0.6)],
    "aura": [note(N["A4"], 0, gain=0.08, decay_ms=70, attack_ms=8),
             note(N["E5"], 70, gain=0.08, decay_ms=260, attack_ms=16,
                  warmth=0.5)],
    "toggleOn": [note(N["E5"], 0, gain=0.09, decay_ms=100, glide=0.04)],
    "toggleOff": [note(N["D5"], 0, gain=0.08, decay_ms=90, glide=-0.04)],
    "send": [note(N["D5"], 0, gain=0.10, decay_ms=90),
             note(N["A5"], 90, gain=0.06, decay_ms=180, attack_ms=14,
                  warmth=0.5)],
    "stop": [note(N["A4"], 0, gain=0.11, decay_ms=100, warmth=0.4)],
    "landed": [note(N["E5"], 0, gain=0.07, decay_ms=120, attack_ms=14),
               note(N["D5"], 110, gain=0.08, decay_ms=260, attack_ms=14)],
    "success": [note(N["D5"], 0, gain=0.08, decay_ms=90),
                note(N["A5"], 90, gain=0.07, decay_ms=220, attack_ms=12,
                     warmth=0.6)],
    "warn": [note(N["B4"], 0, gain=0.09, decay_ms=90, warmth=0.5),
             note(N["B4"], 100, gain=0.08, decay_ms=110, warmth=0.5)],
    "error": [note(N["E5"], 0, gain=0.08, decay_ms=70, warmth=0.6),
              note(N["D5"], 70, gain=0.08, decay_ms=70, warmth=0.6),
              note(N["B4"], 140, gain=0.08, decay_ms=160, warmth=0.6)],
}

# Small room: a few early reflections, gently low-passed.
REFLECTIONS = [(31, 0.20), (47, 0.15), (67, 0.11), (89, 0.07)]


def render(notes):
    tail = int(RATE * 0.12)
    end = max(start + len(samples) for start, samples in notes) + tail
    dry = [0.0] * end
    for start, samples in notes:
        for i, value in enumerate(samples):
            dry[start + i] += value
    wet = list(dry)
    for delay_ms, g in REFLECTIONS:
        d = int(RATE * delay_ms / 1000)
        for i in range(d, end):
            wet[i] += g * dry[i - d]
    # one-pole low-pass on the whole mix: takes the edge off
    mix, y = [], 0.0
    for x in wet:
        y += 0.45 * (x - y)
        mix.append(y)
    peak = max(abs(v) for v in mix) or 1.0
    cut = len(mix)
    while cut > 0 and abs(mix[cut - 1]) < peak * 0.005:
        cut -= 1
    mix = mix[: cut + int(RATE * 0.01)]
    fade = int(RATE * 0.02)
    for i in range(min(fade, len(mix))):
        mix[-1 - i] *= i / fade
    return mix


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, notes in SOUNDS.items():
        samples = render(notes)
        with wave.open(str(OUT / f"{name}.wav"), "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(RATE)
            w.writeframes(b"".join(
                struct.pack("<h", int(max(-1, min(1, s)) * 32767))
                for s in samples))
        peak = max(abs(s) for s in samples)
        print(f"{name}.wav  {len(samples) / RATE * 1000:.0f} ms  "
              f"peak {20 * math.log10(peak):.1f} dBFS")


if __name__ == "__main__":
    main()
