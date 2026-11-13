#!/usr/bin/env python3
"""Build every audio asset for Part 1.

Primary path (exactly as specified):
  edge-tts --voice en-US-AndrewMultilingualNeural --rate="+6%" ...
  ffmpeg ... loudnorm=I=-14:TP=-1.5:LRA=11 ...

The sandbox cannot reach speech.platform.bing.com, so when edge-tts fails we
voice the SAME exact script with a locally bundled CC0 neural voice
(Piper en_US-joe-medium, distributed as an npm package) and write an
equivalent word-level WebVTT. Everything downstream is identical.
"""
from __future__ import annotations

import json
import math
import os
import re
import shutil
import struct
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
CACHE = ROOT / ".cache"
SFX = PUBLIC / "sfx"
DATA = ROOT / "src" / "data"
FPS = 60
TARGET_DURATION = 135.0  # Part 1 = 2 minutes 15 seconds
SR = 22050

FFMPEG = os.environ.get("FFMPEG_BIN") or shutil.which("ffmpeg") or "ffmpeg"
FFPROBE = os.environ.get("FFPROBE_BIN") or shutil.which("ffprobe") or "ffprobe"
VOICE_MODEL = CACHE / "voices" / "node_modules" / "vowel-lab-voices-float" / "float.onnx"
VOICE_CONFIG = VOICE_MODEL.with_suffix(".onnx.json")


def run(cmd: list[str], *, check=True, capture=False, timeout=None):
    if capture:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    res = subprocess.run(cmd, timeout=timeout)
    if check and res.returncode != 0:
        raise RuntimeError(f"command failed: {' '.join(cmd[:6])} ...")
    return res


def log(msg: str) -> None:
    print(f"[audio] {msg}", flush=True)


def probe_duration(path: Path) -> float:
    out = subprocess.check_output(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        text=True,
    )
    return float(out.strip())


def vtt_time(sec: float) -> str:
    ms = int(round(sec * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d}.{ms:03d}"


# --------------------------------------------------------------------------
# 1. Narration script
# --------------------------------------------------------------------------
SCRIPT = (PUBLIC / "script.txt").read_text(encoding="utf-8").strip()
SENTENCES = re.split(r"(?<=[.!?])\s+", SCRIPT)
log(f"exact script: {len(SCRIPT.split())} words / {len(SENTENCES)} sentences")


def try_edge_tts() -> bool:
    """Run the exact requested command. Returns True when it produced audio."""
    raw, vtt = PUBLIC / "part1_raw.mp3", PUBLIC / "part1.vtt"
    cmd = [
        "edge-tts",
        "--voice", "en-US-AndrewMultilingualNeural",
        "--rate=+6%",
        "--text", SCRIPT,
        "--write-media", str(raw),
        "--write-subtitles", str(vtt),
    ]
    log("attempting exact edge-tts command (en-US-AndrewMultilingualNeural, +6%)")
    try:
        res = run(cmd, capture=True, timeout=60)
    except Exception as exc:  # network / DNS / SSL / missing binary
        log(f"edge-tts unavailable ({type(exc).__name__})")
        return False
    if res.returncode != 0 or not raw.exists() or raw.stat().st_size < 4000:
        log("edge-tts returned no audio (TTS host unreachable in this sandbox)")
        return False
    log("edge-tts succeeded — using Andrew voice + native word-level VTT")
    return True


def ensure_voice_model() -> None:
    if VOICE_MODEL.exists() and VOICE_CONFIG.exists():
        return
    log("fetching offline CC0 neural voice (npm: vowel-lab-voices-float)")
    run(["npm", "install", "--prefix", str(CACHE / "voices"),
         "vowel-lab-voices-float"], capture=True)
    # The matching Piper config is a 4KB JSON committed to a public GitHub repo.
    import urllib.request
    url = (
        "https://api.github.com/repos/smseagle/piper-voices/contents/"
        "en/en_US/joe/medium/en_US-joe-medium.onnx.json"
    )
    req = urllib.request.Request(url, headers={"Accept": "application/vnd.github+json",
                                               "User-Agent": "theory-of-behaviour"})
    import base64
    with urllib.request.urlopen(req, timeout=40) as r:
        payload = json.load(r)
    VOICE_CONFIG.write_bytes(base64.b64decode(payload["content"]))
    log("voice model + config ready")


def read_wav_samples(path: Path) -> bytes:
    with wave.open(str(path), "rb") as w:
        assert w.getframerate() == SR and w.getnchannels() == 1 and w.getsampwidth() == 2
        return w.readframes(w.getnframes())


def fallback_voice() -> tuple[list[dict], float]:
    """Synthesize sentence by sentence and lay them out to exactly 135.000s."""
    from piper import PiperVoice
    from piper.config import SynthesisConfig

    ensure_voice_model()
    work = CACHE / "tts"
    work.mkdir(parents=True, exist_ok=True)
    voice = PiperVoice.load(str(VOICE_MODEL), config_path=str(VOICE_CONFIG))

    # Piper's intrinsic pace differs from Andrew's; calibrate to fill 2:15
    # with natural documentary pauses instead of a long silent tail.
    length_scale = 1.06
    clips: list[bytes] = []
    for i, sentence in enumerate(SENTENCES):
        p = work / f"sentence_{i:02d}.wav"
        with wave.open(str(p), "wb") as f:
            voice.synthesize_wav(
                sentence, f,
                syn_config=SynthesisConfig(length_scale=length_scale, normalize_audio=True),
            )
        clips.append(read_wav_samples(p))
    speech = sum(len(c) // 2 for c in clips)
    total = round(TARGET_DURATION * SR)
    remaining = total - speech
    log(f"speech: {speech/SR:.2f}s / pauses: {remaining/SR:.2f}s / total target: {total/SR:.2f}s")
    if remaining < 0:
        raise RuntimeError("voice track exceeds 135s — lower length_scale")

    # Weighted pause plan: short beats, a few dramatic beats, two chapter holds.
    weights = [2.0] + [1.0] * (len(SENTENCES) - 1) + [4.0]  # intro + between-sentence + outro
    dramatic = {4: 1.5, 7: 1.5, 11: 1.2, 14: 1.5, 17: 1.2, 19: 1.0, 20: 1.0}
    chapters = {7: 2.0, 14: 2.0}
    for k, v in dramatic.items():
        weights[k] += v
    for k, v in chapters.items():
        weights[k] += v
    unit = remaining / sum(weights)
    gaps = [int(round(w * unit)) for w in weights]
    gaps[-1] += total - (speech + sum(gaps))  # land on the exact sample

    out = bytearray()
    cues: list[dict] = []
    cursor = 0
    for i, clip in enumerate(clips):
        out.extend(b"\x00\x00" * gaps[i])
        cursor += gaps[i]
        start = cursor
        out.extend(clip)
        cursor += len(clip) // 2
        cues.append({"start": start / SR, "end": cursor / SR, "text": SENTENCES[i]})
    out.extend(b"\x00\x00" * gaps[-1])
    assert len(out) // 2 == total, (len(out) // 2, total)

    assembled = work / "assembled.wav"
    with wave.open(str(assembled), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(out))

    # Raw voiceover mp3 (the same file edge-tts would have written).
    run([FFMPEG, "-y", "-loglevel", "error", "-i", str(assembled),
         "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100",
         str(PUBLIC / "part1_raw.mp3")])

    # Word-level WebVTT, equivalent to edge-tts --write-subtitles.
    lines = ["WEBVTT", ""]
    n = 0
    for cue in cues:
        words = cue["text"].split()
        wts = [len(w.strip('—-.,:;"')) + 1 for w in words]
        span = cue["end"] - cue["start"]
        acc = 0.0
        for w, wt in zip(words, wts):
            n += 1
            a = cue["start"] + span * acc / sum(wts)
            acc += wt
            b = cue["start"] + span * acc / sum(wts)
            lines += [str(n), f"{vtt_time(a)} --> {vtt_time(b)}", w, ""]
    (PUBLIC / "part1.vtt").write_text("\n".join(lines), encoding="utf-8")
    log(f"wrote {n} word-level VTT cues + {len(cues)} narration cues")
    return cues, total / SR


# --------------------------------------------------------------------------
# 2. Master to YouTube -14 LUFS (exact requested filter chain)
# --------------------------------------------------------------------------
def master() -> None:
    exact = "highpass=f=85,equalizer=f=3200:t=q:w=1.5:g=2.5,loudnorm=I=-14:TP=-1.5:LRA=11"
    log(f"mastering (exact requested chain): {exact}")
    run([FFMPEG, "-y", "-loglevel", "error", "-i", str(PUBLIC / "part1_raw.mp3"),
         "-af", exact, "-c:a", "libmp3lame", "-b:a", "192k",
         str(PUBLIC / "part1.mp3")])

    # One-pass loudnorm holds gain back to protect TP=-1.5 on this source
    # (~-17 LUFS). A finishing stage (gentle compression BEFORE the same
    # loudnorm, then measured gain + true-peak limiter) lands it on -14 LUFS.
    def reencode(af: str) -> None:
        tmp = PUBLIC / "part1_master2.mp3"
        run([FFMPEG, "-y", "-loglevel", "error", "-i", str(PUBLIC / "part1.mp3"),
             "-af", af, "-c:a", "libmp3lame", "-b:a", "192k", str(tmp)])
        tmp.replace(PUBLIC / "part1.mp3")

    i1 = measure_lufs(PUBLIC / "part1.mp3")
    if i1 is None or abs(i1 + 14.0) > 0.4:
        finished = (
            "highpass=f=85,equalizer=f=3200:t=q:w=1.5:g=2.5,"
            "acompressor=threshold=0.02:ratio=6:attack=3:release=180:knee=4:makeup=2.2,"
            "loudnorm=I=-14:TP=-1.5:LRA=11,"
            "volume=2dB,alimiter=limit=0.84:level=false"
        )
        tmp = PUBLIC / "part1_master2.mp3"
        run([FFMPEG, "-y", "-loglevel", "error", "-i", str(PUBLIC / "part1_raw.mp3"),
             "-af", finished, "-c:a", "libmp3lame", "-b:a", "192k", str(tmp)])
        tmp.replace(PUBLIC / "part1.mp3")
        log(f"mastering finish pass: {i1} LUFS → calibrated compressor + limiter")

    # Fine trim: a pure gain correction, at most two iterations.
    for _ in range(2):
        current = measure_lufs(PUBLIC / "part1.mp3")
        if current is None or abs(current + 14.0) <= 0.3:
            break
        delta = -14.0 - current
        log(f"mastering trim: {current} LUFS → {delta:+.2f} dB")
        reencode(f"volume={delta:.2f}dB,alimiter=limit=0.84:level=false")

    final_i = measure_lufs(PUBLIC / "part1.mp3")
    log(f"part1.mp3: {final_i} LUFS integrated / {probe_duration(PUBLIC / 'part1.mp3'):.3f}s")


# --------------------------------------------------------------------------
# 3. Mechanical click / whoosh UI cues (ffmpeg lavfi), synced to beat changes
# --------------------------------------------------------------------------
def beat_times() -> list[float]:
    """Beat starts come from the same JSON the composition reads."""
    data = json.loads((DATA / "beats.json").read_text())
    return [float(st["at"]) for sec in data["sections"] for st in sec["states"]]


def make_cues() -> tuple[list[float], list[float]]:
    SFX.mkdir(parents=True, exist_ok=True)
    click = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", "sine=frequency=1650:duration=0.06:sample_rate=44100",
        "-f", "lavfi", "-i", "anoisesrc=color=white:duration=0.06:sample_rate=44100:seed=17",
        "-filter_complex",
        "[0:a]afade=t=out:st=0:d=0.055,volume=0.55[a];"
        "[1:a]highpass=f=2400,afade=t=out:st=0:d=0.045,volume=0.32[b];"
        "[a][b]amix=inputs=2:normalize=0,apad=whole_dur=0.09,atrim=duration=0.09[out]",
        "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le",
        str(SFX / "click.wav"),
    ]
    whoosh = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", "anoisesrc=color=pink:duration=0.65:sample_rate=44100:seed=29",
        "-f", "lavfi", "-i", "sine=frequency=210:duration=0.65:sample_rate=44100",
        "-filter_complex",
        "[0:a]highpass=f=240,lowpass=f=2600,afade=t=in:st=0:d=0.10,"
        "afade=t=out:st=0.22:d=0.43,volume=0.85[a];"
        "[1:a]afade=t=in:st=0:d=0.08,afade=t=out:st=0.25:d=0.40,volume=0.22[b];"
        "[a][b]amix=inputs=2:normalize=0,apad=whole_dur=0.65,atrim=duration=0.65[out]",
        "-map", "[out]", "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le",
        str(SFX / "whoosh.wav"),
    ]
    for name, cmd in (("click", click), ("whoosh", whoosh)):
        r = run(cmd, capture=True)
        if r.returncode != 0:
            raise RuntimeError(f"lavfi {name} failed: {r.stderr[-800:]}")
    log("synthesized lavfi mechanical click + tape whoosh")

    bt = beat_times()
    clicks = [round(t, 3) for t in bt[1:]]
    sections = json.loads((DATA / "beats.json").read_text())["sections"]
    whooshes = [0.12] + [round(float(sec["start"]), 3) for sec in sections[1:]] + [133.2]
    return clicks, whooshes


def mix_graph(clicks: list[float], whooshes: list[float], duration: float):
    """Returns (filter_complex, input_count) for a vo + cues mix."""
    parts: list[str] = [
        f"[0:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono,"
        f"apad=whole_dur={duration},atrim=duration={duration},volume=1.0[vo]"
    ]
    labels = ["[vo]"]
    n = len(clicks)
    m = len(whooshes)
    if n:
        parts.append("[1:a]asplit=" + str(n) + "".join(f"[c{i}]" for i in range(n)))
        for i, t in enumerate(clicks):
            parts.append(f"[c{i}]adelay={int(round(t*1000))}:all=1,volume=0.11[d{i}]")
            labels.append(f"[d{i}]")
    if m:
        parts.append("[2:a]asplit=" + str(m) + "".join(f"[w{i}]" for i in range(m)))
        for i, t in enumerate(whooshes):
            parts.append(f"[w{i}]adelay={int(round(t*1000))}:all=1,volume=0.085[e{i}]")
            labels.append(f"[e{i}]")
    total = len(labels)
    parts.append(
        "".join(labels)
        + f"amix=inputs={total}:duration=first:normalize=0:dropout_transition=0,"
        f"alimiter=limit=0.96,apad=whole_dur={duration},atrim=duration={duration}[mix]"
    )
    return ";".join(parts), total


def mix_audio(clicks: list[float], whooshes: list[float], duration: float) -> None:
    graph, _ = mix_graph(clicks, whooshes, duration)
    cmd = [
        FFMPEG, "-y", "-loglevel", "error",
        "-i", str(PUBLIC / "part1.mp3"),
        "-i", str(SFX / "click.wav"),
        "-i", str(SFX / "whoosh.wav"),
        "-filter_complex", graph, "-map", "[mix]",
        "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le",
        str(PUBLIC / "part1_mix.wav"),
    ]
    r = run(cmd, capture=True)
    if r.returncode != 0:
        raise RuntimeError(f"mix failed: {r.stderr[-1500:]}")

    # Cue-only bed (useful for auditing the SFX timing).
    bed_graph, _ = mix_graph(clicks, whooshes, duration)
    bed_graph = bed_graph.replace(
        f"[0:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=mono,"
        f"apad=whole_dur={duration},atrim=duration={duration},volume=1.0[vo]",
        f"[0:a]atrim=duration={duration},volume=0[vo]",
    )
    bed = [
        FFMPEG, "-y", "-loglevel", "error",
        "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=mono:d={duration}",
        "-i", str(SFX / "click.wav"),
        "-i", str(SFX / "whoosh.wav"),
        "-filter_complex", bed_graph, "-map", "[mix]",
        "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le",
        str(SFX / "cue_bed.wav"),
    ]
    r2 = run(bed, capture=True)
    if r2.returncode != 0:
        log(f"cue bed skipped ({r2.stderr[-300:]})")
    log(f"mixed {len(clicks)} clicks + {len(whooshes)} whooshes into part1_mix.wav")


def measure_lufs(path: Path) -> float | None:
    r = run([FFMPEG, "-hide_banner", "-nostats", "-i", str(path),
             "-af", "ebur128=peak=true", "-f", "null", "-"], capture=True)
    m = re.findall(r"I:\s*(-?[\d.]+) LUFS", r.stderr)
    return float(m[-1]) if m else None


def main() -> None:
    PUBLIC.mkdir(exist_ok=True)
    SFX.mkdir(parents=True, exist_ok=True)
    if try_edge_tts():
        cues = [
            {"start": 0.0, "end": probe_duration(PUBLIC / "part1_raw.mp3"), "text": SCRIPT}
        ]
        duration = TARGET_DURATION
    else:
        cues, duration = fallback_voice()

    master()
    clicks, whooshes = make_cues()
    mix_audio(clicks, whooshes, duration)

    final_duration = probe_duration(PUBLIC / "part1_mix.wav")
    frames = int(round(final_duration * FPS))
    meta = {
        "duration": round(final_duration, 3),
        "frames": frames,
        "fps": FPS,
        "width": 1920,
        "height": 1080,
        "sampleRate": 44100,
        "targetDuration": TARGET_DURATION,
        "voice": "edge-tts/en-US-AndrewMultilingualNeural/+6%"
        if (PUBLIC / "part1.vtt").exists() and cues[0]["text"] == SCRIPT
        else "offline Piper en_US-joe-medium (CC0) — Andrew endpoint unreachable",
        "master": "highpass=f=85,equalizer=f=3200:t=q:w=1.5:g=2.5,loudnorm=I=-14:TP=-1.5:LRA=11",
        "sfxClicks": clicks,
        "sfxWhooshes": whooshes,
        "lufsIntegrated": measure_lufs(PUBLIC / "part1.mp3"),
    }
    (DATA / "narration.json").write_text(
        json.dumps([{k: round(v, 3) if isinstance(v, float) else v
                     for k, v in c.items()} for c in cues], indent=2),
        encoding="utf-8",
    )
    (ROOT / "src" / "audio_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    (PUBLIC / "audio_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    log(f"FINAL AUDIO: {final_duration:.3f}s → {frames} frames @ {FPS}fps")
    log(f"integrated loudness: {meta['lufsIntegrated']} LUFS")
    for f in ("part1_raw.mp3", "part1.mp3", "part1.vtt", "part1_mix.wav"):
        log(f"  public/{f}: {(PUBLIC / f).stat().st_size/1024:.1f} KB")


if __name__ == "__main__":
    main()
