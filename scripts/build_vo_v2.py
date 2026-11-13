"""Build the v2 voiceover from generated chunks.

Reads .cache/vo/chunks.json  ->  [{file, beats:[ids]}]
Writes .cache/vo/vo_master.wav, .cache/vo/timing.json, public/part1_v2.vtt

The TTS read is good but its pauses are long, which is what made the old cut
feel like a documentary. We keep every spoken sample and shorten only the
silence: same voice, faster brain. No global time-stretch, so no chipmunk.
"""
import json
import re
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
VO = ROOT / ".cache" / "vo"
PUB = ROOT / "public"
SR = 44100

GAP_INTERNAL = 0.10
GAP_CHUNK = 0.28
LEAD = 0.14
TAIL = 0.90


def read_wav(p: Path) -> np.ndarray:
    with wave.open(str(p), "rb") as w:
        assert w.getframerate() == SR, w.getframerate()
        return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0


def speech_spans(x: np.ndarray):
    hop, win = int(0.010 * SR), int(0.025 * SR)
    n = 1 + (len(x) - win) // hop
    frames = np.lib.stride_tricks.sliding_window_view(x, win)[::hop][:n]
    rms = np.sqrt((frames ** 2).mean(axis=1))
    peak = float(np.percentile(rms, 99.5)) or 1.0
    voiced = rms > peak * 0.035
    for i in range(1, len(voiced) - 1):
        if not voiced[i] and voiced[i - 1] and voiced[i + 1]:
            voiced[i] = True
    spans, run = [], None
    for i, v in enumerate(voiced):
        if v and run is None:
            run = i
        elif not v and run is not None:
            spans.append([run * hop, min(len(x), i * hop + win)])
            run = None
    if run is not None:
        spans.append([run * hop, len(x)])
    spans = [s for s in spans if s[1] - s[0] > int(0.07 * SR)]
    merged = []
    for a, b in spans:
        if merged and a - merged[-1][1] < int(0.09 * SR):
            merged[-1][1] = b
        else:
            merged.append([a, b])
    return merged


def tighten(x: np.ndarray, spans):
    gap = int(GAP_INTERNAL * SR)
    out, marks = [], []
    for i, (a, b) in enumerate(spans):
        if i:
            out.append(np.zeros(gap, dtype=np.float32))
        at = sum(len(p) for p in out)
        marks.append((at, at + (b - a)))
        out.append(x[a:b])
    return (np.concatenate(out) if out else np.zeros(0, np.float32)), marks


def sentences(text: str):
    return [p for p in re.split(r"(?<=[.?!])\s+", text.strip()) if p]


def align(segs, marks):
    ns, nm = len(segs), len(marks)
    if nm < ns:
        marks = marks + [marks[-1]] * (ns - nm)
        nm = ns
    chars = np.array([len(s) for s in segs], float)
    durs = np.array([b - a for a, b in marks], float)
    tc, td = chars.sum(), max(durs.sum(), 1)
    INF = 1e18
    cost = np.full((ns + 1, nm + 1), INF)
    back = np.zeros((ns + 1, nm + 1), int)
    cost[0, 0] = 0
    for i in range(1, ns + 1):
        for j in range(1, nm + 1):
            for k in range(max(0, j - 6), j):
                if cost[i - 1][k] >= INF:
                    continue
                pred = td * chars[i - 1] / tc
                d = durs[k:j].sum()
                pen = abs(d - pred) / (pred + 1e-6) + (0.12 * (j - k - 1) if j - k > 1 else 0)
                v = cost[i - 1][k] + pen
                if v < cost[i][j]:
                    cost[i][j], back[i][j] = v, k
    j, mapping = nm, []
    for i in range(ns, 0, -1):
        k = back[i][j]
        mapping.append((k, j))
        j = k
    mapping.reverse()
    return [(marks[k][0], marks[j - 1][1]) for k, j in mapping]


def fmt(t: float) -> str:
    h, m = int(t // 3600), int(t % 3600 // 60)
    return f"{h:02d}:{m:02d}:{t % 60:06.3f}"


def main():
    cfg = json.loads((VO / "chunks.json").read_text())
    beats = {b["id"]: b for b in json.loads((ROOT / "src/data/beats_v2.json").read_text())["beats"]}

    parts, cursor = [np.zeros(int(LEAD * SR), np.float32)], LEAD
    timeline, phrases, out_beats = [], [], []
    for entry in cfg:
        x = read_wav(VO / "wav" / f"{entry['file']}.wav")
        x = x / (np.abs(x).max() or 1.0) * 0.92

        text = " ".join(beats[b]["text"] for b in entry["beats"])
        segs = sentences(text)
        out, marks = tighten(x, speech_spans(x))
        fits = align(segs, marks)

        chunk_start = cursor
        for seg, (a, b) in zip(segs, fits):
            phrases.append({"text": seg, "start": round(chunk_start + a / SR, 3), "end": round(chunk_start + b / SR, 3)})

        # map fits onto beats: each beat owns a contiguous run of sentences
        at = 0
        for bid in entry["beats"]:
            n = len(sentences(beats[bid]["text"]))
            span = fits[at: at + n] or fits[-1:]
            at += n
            out_beats.append({
                "id": bid,
                "start": round(chunk_start + span[0][0] / SR, 3),
                "end": round(chunk_start + span[-1][1] / SR, 3),
            })

        timeline.append({"file": entry["file"], "start": round(cursor, 3), "end": round(cursor + len(out) / SR, 3)})
        parts.append(out)
        cursor += len(out) / SR
        parts.append(np.zeros(int(GAP_CHUNK * SR), np.float32))
        cursor += GAP_CHUNK

    parts.append(np.zeros(int(TAIL * SR), np.float32))
    master = np.concatenate(parts)
    master = master / (np.abs(master).max() or 1.0) * 0.92
    dur = len(master) / SR

    with wave.open(str(VO / "vo_master.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((np.clip(master, -1, 1) * 32767).astype(np.int16).tobytes())

    words = sum(len(p["text"].split()) for p in phrases)
    (VO / "timing.json").write_text(json.dumps({
        "duration": round(dur, 3),
        "fps": 60,
        "frames": int(round(dur * 60)),
        "words": words,
        "wpm": round(words / dur * 60),
        "chunks": timeline,
        "beats": out_beats,
        "phrases": phrases,
    }, indent=1), encoding="utf-8")

    lines, n = ["WEBVTT", ""], 0
    for ph in phrases:
        ws = ph["text"].split()
        chars = np.array([len(re.sub(r"[^\w']", "", w)) + 1 for w in ws], float)
        cum = np.cumsum(chars) / chars.sum()
        t0, span, start = ph["start"], ph["end"] - ph["start"], ph["start"]
        for w, c in zip(ws, cum):
            end = max(t0 + span * c, start + 0.06)
            n += 1
            lines += [str(n), f"{fmt(start)} --> {fmt(end)}", w, ""]
            start = end
    (PUB / "part1_v2.vtt").write_text("\n".join(lines), encoding="utf-8")

    print(f"duration {dur:.2f}s  frames {int(round(dur*60))}  phrases {len(phrases)}  words {words}  pace {words/dur*60:.0f} wpm")
    for b in out_beats:
        print(f"  {b['id']:>4}  {b['start']:6.2f} -> {b['end']:6.2f}  ({(b['end']-b['start']):.2f}s)")


if __name__ == "__main__":
    main()
