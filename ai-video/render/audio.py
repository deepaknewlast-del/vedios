"""Synthesised score + sound design + VO mix. No samples: everything is generated.

Sections follow the cut list in shots.py. Output: audio/mix.wav (48 kHz stereo).
"""
import json
import math
import os
import wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUD = os.path.join(ROOT, "audio")


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def hz(note):
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7,
             "G#": 8, "A": 9, "A#": 10, "B": 11}
    n, octv = note[:-1], int(note[-1])
    midi = 12 * (octv + 1) + names[n]
    return 440.0 * 2 ** ((midi - 69) / 12)


def env(n, a=0.01, d=0.2, s=0.7, r=0.4, dur=None):
    """ADSR over n samples (seconds)."""
    dur = dur if dur else n / SR
    ai, di, ri = int(a * SR), int(d * SR), int(r * SR)
    ai, di, ri = min(ai, n), min(di, n), min(ri, n)
    e = np.zeros(n, dtype=np.float32)
    i = 0
    if ai:
        e[:ai] = np.linspace(0, 1, ai) ** 1.5
        i = ai
    if di and i < n:
        k = min(di, n - i)
        e[i:i + k] = np.linspace(1, s, k)
        i += k
    if i < n - ri:
        e[i:n - ri] = s
        i = n - ri
    if ri and i < n:
        e[i:] = np.linspace(s, 0, n - i) ** 0.8 if n - i > 1 else 0
    return e


def sine(f, dur, detune=0.0, phase=0.0):
    t = t_axis(dur)
    return np.sin(2 * np.pi * (f * (1 + detune)) * t + phase).astype(np.float32)


def saw(f, dur, harmonics=18, detune=0.0, rolloff=1.0):
    t = t_axis(dur)
    out = np.zeros_like(t, dtype=np.float32)
    for h in range(1, harmonics + 1):
        if f * h > 15000:
            break
        out += (np.sin(2 * np.pi * f * h * (1 + detune) * t) / (h ** rolloff)).astype(np.float32)
    return out / np.max(np.abs(out) + 1e-9)


def noise(dur, seed=0):
    rng = np.random.default_rng(seed)
    return rng.normal(0, 1, int(dur * SR)).astype(np.float32)


def lp(x, cutoff, order=2):
    sos = butter(order, cutoff / (SR / 2), btype="low", output="sos")
    return sosfilt(sos, x).astype(np.float32)


def hp(x, cutoff, order=2):
    sos = butter(order, cutoff / (SR / 2), btype="high", output="sos")
    return sosfilt(sos, x).astype(np.float32)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], btype="band", output="sos")
    return sosfilt(sos, x).astype(np.float32)


def reverb_ir(dur=2.6, decay=3.0, seed=11):
    n = int(dur * SR)
    rng = np.random.default_rng(seed)
    ir = rng.normal(0, 1, n).astype(np.float32)
    ir *= np.exp(-decay * np.arange(n) / SR)[:, None] if False else np.exp(-decay * np.arange(n) / SR)
    ir = lp(ir, 5200)
    ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    return ir / (np.max(np.abs(ir)) + 1e-9)


IR = reverb_ir()


def verb(x, wet=0.35, ir=IR, gain=1.0):
    w = fftconvolve(x, ir)[: len(x)]
    return (x * (1 - wet) + w * wet) * gain


class Bus:
    def __init__(self, dur):
        self.n = int(dur * SR)
        self.buf = np.zeros(self.n, dtype=np.float32)

    def add(self, sig, at, gain=1.0):
        i = int(at * SR)
        if i >= self.n or i < 0:
            return
        k = min(len(sig), self.n - i)
        self.buf[i:i + k] += sig[:k] * gain


# ------------------------------------------------------------------ timeline
def load_durs():
    return json.load(open(os.path.join(AUD, "vo", "durations.json")))


def build_sections():
    """(name, start, dur) from the shot list, single source of truth."""
    import sys
    sys.path.insert(0, os.path.join(ROOT, "render"))
    import shots
    tl, total = shots.timeline()
    return [(idx, at, dur) for idx, fn, at, dur in tl], total


VO_CUES = {1: ("01", 0.9), 2: ("02", 0.7), 3: ("03", 0.9), 5: ("07", 0.8),
           6: ("09", 0.7), 7: ("04", 1.2), 8: ("08", 0.8), 9: ("05", 0.9),
           10: ("06", 1.0), 11: ("10", 1.1)}

# chord per shot (root, third, fifth, colour)
CHORDS = {
    1: ("D2", "A2", "F3", "C4"),
    2: ("D2", "A2", "F3", "E4"),
    3: ("A#1", "F2", "D3", "F3"),
    4: ("A#1", "F2", "D3", "A3"),
    5: ("F2", "C3", "A3", "C4"),
    6: ("G1", "D2", "A#2", "D3"),
    7: ("D2", "A2", "F3", "A3"),
    8: ("A#1", "F2", "D3", "D4"),
    9: ("G1", "D2", "A#2", "F3"),
    10: ("D2", "A2", "F3", "A3"),
    11: ("D2", "A2", "E3", "F3"),
    12: ("D2", "A2", "F3", "C4"),
}


def pad(section_dur, notes, amp=0.5, bright=0.5):
    n = int(section_dur * SR)
    out = np.zeros(n, dtype=np.float32)
    for i, nm in enumerate(notes):
        f = hz(nm)
        # slow chorus of two detuned saws + a sine sub
        v = 0.6 * saw(f, section_dur, harmonics=10, detune=+0.0016, rolloff=1.4)
        v += 0.6 * saw(f, section_dur, harmonics=10, detune=-0.0018, rolloff=1.4)
        v += 0.7 * sine(f, section_dur)
        lfo = 0.85 + 0.15 * np.sin(2 * np.pi * (0.05 + 0.02 * i) * t_axis(section_dur) + i)
        out += (v * lfo).astype(np.float32) * (0.55 - 0.08 * i)
    out = lp(out, 700 + 1800 * bright)
    return out * amp


def impact(dur=2.6, root="D2", gain=0.9, bright=0.35):
    n = int(dur * SR)
    t = t_axis(dur)
    f0 = hz(root) * 2
    sweep = f0 * np.exp(-t * 1.6) + hz(root) * 0.45
    ph = 2 * np.pi * np.cumsum(sweep) / SR
    body = np.sin(ph).astype(np.float32)
    body *= np.exp(-t * 1.9)
    click = hp(noise(dur, 5), 900) * np.exp(-t * 22) * 0.5
    tail = lp(noise(dur, 6), 500) * np.exp(-t * 2.4) * 0.22 * bright
    sig = (body * 0.9 + click + tail).astype(np.float32)
    return verb(sig, 0.42) * gain


def riser(dur=2.2, gain=0.5):
    n = int(dur * SR)
    t = t_axis(dur)
    nz = noise(dur, 9)
    # rising band-pass sweep
    out = np.zeros(n, dtype=np.float32)
    seg = 8
    for i in range(seg):
        a, b = int(i * n / seg), int((i + 1) * n / seg)
        c = min(300 * (2 ** (i * 1.15)), 7000)
        out[a:b] = bp(nz[a:b], c * 0.7, min(c * 1.6, 18000))
    out *= (np.linspace(0, 1, n) ** 2.2)
    tone = sine(hz("D3"), dur) * (np.linspace(0, 1, n) ** 3) * 0.25
    return verb((out * 0.8 + tone).astype(np.float32), 0.3) * gain


def bell(note, dur=2.4, gain=0.4, seed=3):
    n = int(dur * SR)
    t = t_axis(dur)
    f = hz(note)
    sig = np.zeros(n, dtype=np.float32)
    for ratio, amp, dec in ((1.0, 1.0, 1.6), (2.01, 0.5, 2.4), (3.02, 0.24, 3.2), (4.98, 0.1, 4.6)):
        sig += (np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec) * amp).astype(np.float32)
    sig *= np.clip(t / 0.006, 0, 1)
    return verb(sig, 0.5, gain=gain)


def tick(dur=0.14, gain=0.22, seed=7):
    n = int(dur * SR)
    t = t_axis(dur)
    s = bp(noise(dur, seed), 1800, 6500) * np.exp(-t * 55)
    s += sine(1180, dur) * np.exp(-t * 70) * 0.3
    return s.astype(np.float32) * gain


def heartbeat(dur=0.9, gain=0.5):
    n = int(dur * SR)
    t = t_axis(dur)
    f = hz("D1") * (1 + 0.5 * np.exp(-t * 20))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph).astype(np.float32) * np.exp(-t * 6.5)
    return s * gain


def sea(dur, gain=0.25, seed=21):
    n = int(dur * SR)
    nz = noise(dur, seed)
    body = lp(nz, 900) * 0.7 + bp(nz, 900, 3200) * 0.18
    t = t_axis(dur)
    swell = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t) * np.sin(2 * np.pi * 0.031 * t + 1.2)
    return (body * swell).astype(np.float32) * gain


def wind(dur, gain=0.18, seed=34):
    nz = noise(dur, seed)
    b = bp(nz, 200, 1500)
    t = t_axis(dur)
    return (b * (0.5 + 0.5 * np.sin(2 * np.pi * 0.045 * t))).astype(np.float32) * gain


# ------------------------------------------------------------------ build
def main():
    secs, total = build_sections()
    print("timeline total %.2fs" % total)
    N = int((total + 1.5) * SR)
    music = Bus(total + 1.5)
    sfx = Bus(total + 1.5)
    amb = Bus(total + 1.5)

    # ambient bed across the whole film
    amb.add(sea(total), 0.0, 0.55)
    amb.add(wind(total), 0.0, 0.5)

    for idx, at, dur in secs:
        notes = CHORDS.get(idx, CHORDS[12])
        bright = {"1": 0.3, "2": 0.35, "3": 0.55, "4": 0.7, "5": 0.4, "6": 0.25,
                  "7": 0.5, "8": 0.55, "9": 0.3, "10": 0.3, "11": 0.6, "12": 0.4}[str(idx)]
        p = pad(dur + 1.2, notes, amp=0.32, bright=bright)
        # gentle entry/exit so sections don't click
        e = np.ones(len(p), dtype=np.float32)
        k = min(int(0.6 * SR), len(p) // 2)
        e[:k] = np.linspace(0, 1, k)
        e[-k:] = np.linspace(1, 0, k)
        music.add((p * e), at, 1.0)

    # sub pulse (slow, every 2.4 s) through the middle of the film
    beat = 2.4
    for i in range(int(total / beat)):
        b = i * beat
        if b < 8.0 or b > total - 6:
            continue
        music.add(heartbeat(1.0, 0.30), b, 1.0)

    # ---- accents
    b4 = secs[3][1]                      # battleship reveal
    sfx.add(riser(2.0, 0.42), b4 - 2.0, 1.0)
    sfx.add(impact(2.8, "D2", 0.85), b4, 1.0)

    b3 = secs[2][1]
    sfx.add(whoosh(1.1, 0.32), b3 - 0.2, 1.0)
    sfx.add(impact(1.6, "A#1", 0.45, 0.2), b3, 1.0)

    b5 = secs[4][1]
    sfx.add(whoosh(0.9, 0.22), b5, 1.0)

    # monotone ticks: tension in the mine + evacuation
    start_t, end_t = secs[7][1], secs[9][1]
    tt = start_t
    i = 0
    while tt < end_t:
        sfx.add(tick(0.14, 0.16 + 0.05 * (i % 2)), tt, 1.0)
        tt += 0.6
        i += 1

    # belling motif (sparse)
    for note, tm, g in (("D5", 2.2, 0.20), ("F5", 5.2, 0.14), ("A4", 13.0, 0.16),
                        ("C5", 20.0, 0.12), ("D5", 27.5, 0.15), ("F4", 36.0, 0.13),
                        ("A4", 44.0, 0.14), ("C5", 52.0, 0.12), ("D5", 60.0, 0.16),
                        ("F5", 68.0, 0.13), ("A4", 74.0, 0.11)):
        if tm < total - 1:
            sfx.add(bell(note, 2.6, g), tm, 1.0)

    # evacuation: heartbeat accelerates
    ev = secs[8][1]
    for i in range(10):
        sfx.add(heartbeat(0.9, 0.34), ev + 0.35 + i * (0.78 - 0.03 * i), 1.0)

    # title hit
    t11 = secs[10][1]
    sfx.add(riser(2.4, 0.30), t11 - 2.4, 1.0)
    sfx.add(impact(3.4, "D2", 0.9, 0.5), t11, 1.0)
    sfx.add(bell("D5", 3.4, 0.22), t11 + 0.05, 1.0)

    # fade the bed out at the end
    fade_n = int(3.2 * SR)
    for b in (music, sfx, amb):
        b.buf[-fade_n:] *= np.linspace(1, 0, fade_n) ** 1.4
    # fade in
    fin = int(1.2 * SR)
    for b in (music, sfx, amb):
        b.buf[:fin] *= np.linspace(0, 1, fin) ** 1.3

    bed = music.buf * 0.85 + sfx.buf * 0.9 + amb.buf * 0.75
    bed = np.stack([bed, bed], axis=1)

    # ---------------- VO placement
    durs = load_durs()
    vo = Bus(total + 1.5)
    for idx, at, dur in secs:
        if idx in VO_CUES:
            name, off = VO_CUES[idx]
            path = os.path.join(AUD, "vo", name + ".mp3")
            sig = load_audio(path)
            vo.add(sig, at + off, 1.0)
            print("  VO %s @ %.2f (%.2fs)" % (name, at + off, len(sig) / SR))

    # duck the bed under narration (sidechain-style, smoothed)
    env_vo = np.abs(vo.buf)
    k = int(0.09 * SR)
    ker = np.ones(k, dtype=np.float32) / k
    env_vo = np.convolve(env_vo, ker, mode="same")
    duck = 1.0 - 0.45 * np.clip(env_vo / 0.10, 0, 1)
    duck = np.convolve(duck, np.ones(int(0.35 * SR)) / int(0.35 * SR), mode="same")
    bed = bed * duck[:, None]

    vo_st = np.stack([vo.buf, vo.buf], axis=1)
    vo_st = vo_st / (np.max(np.abs(vo_st)) + 1e-9) * 0.92

    mix = bed + vo_st * 1.05
    # gentle bus compression-ish (soft clip) + peak normalise
    mix = np.tanh(mix * 0.82) * 0.86
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.89

    out = os.path.join(AUD, "mix.wav")
    write_wav(out, mix)
    print("wrote", out, mix.shape)


def whoosh(dur=1.0, gain=0.3, seed=13):
    n = int(dur * SR)
    t = t_axis(dur)
    nz = noise(dur, seed)
    out = np.zeros(n, dtype=np.float32)
    seg = 10
    for i in range(seg):
        a, b = int(i * n / seg), int((i + 1) * n / seg)
        c = max(90.0, 2600 * (2 ** (-i * 0.28)))
        out[a:b] = bp(nz[a:b], c * 0.45, min(c * 1.05, 18000))
    env_ = np.sin(np.linspace(0, np.pi, n)) ** 2
    return verb(out * env_, 0.35) * gain


def load_audio(path):
    """Decode mp3 -> mono float32 @48k using ffmpeg."""
    import subprocess
    import imageio_ffmpeg
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    raw = subprocess.run([ff, "-v", "quiet", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).copy()
    return a


def write_wav(path, stereo):
    a = np.clip(stereo, -1, 1)
    pcm = (a * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main()
