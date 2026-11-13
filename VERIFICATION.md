# Part 1 — build verification

Measured on the delivered artifacts in this repo.

## Spec compliance

| Requirement | Delivered | Status |
|---|---|---|
| Resolution / frame rate | `1920×1080 @ 60 fps` | ✅ |
| Duration (Part 1) | `135.000 s` = `8100` frames = **2:15** | ✅ |
| Narration script | exact 283-word script from the brief (`public/script.txt`) | ✅ verbatim |
| Subtitles | word-level WebVTT, **283** cues (`public/part1.vtt`) | ✅ |
| Loudness | master `-14.2 LUFS`; delivered MP4 measures **-13.9 LUFS / -1.1 dBTP** | ✅ (`-14` target) |
| Voice chain | `highpass=f=85,equalizer=f=3200:t=q:w=1.5:g=2.5,loudnorm=I=-14:TP=-1.5:LRA=11` | ✅ exact command run |
| UI cues | **31** mechanical clicks + **4** tape whooshes, generated with `ffmpeg` lavfi, delayed to every beat boundary | ✅ |
| Beat cadence | 32 beats, **3.9 – 4.6 s** apart (fresh visual state or camera move each beat) | ✅ |
| Stick figures | none — vector schematics only | ✅ |

## Design tokens

`#F4EFE2` paper · `32px` grid `#E0D8C8` · `3px solid #181818` borders ·
`4px 4px 0px #181818` shadows · `#8BB8B8` / `#B8D6D4` sage · `#E39A83` terracotta ·
`#F2CA6B` mustard · `#D3D5D4` grey · `#E03C31` alert red ·
Comic Neue 700 italic headers with `[ 1 ] [ 2 ] [ 3 ]` black square badges ·
Space Mono 700 for matrix data and callout tags · baked film grain overlay.

## Section map

| Plate | Frames | Time | Beats |
|---|---|---|---|
| 01 Hook comparison | `0 – 2069` | 0:00–0:34.5 | 8 |
| 02 1966 lab wireframe | `2070 – 4799` | 0:34.5–1:20 | 11 |
| 03 Competence × warmth matrix | `4800 – 8099` | 1:20–2:15 | 13 |

## Audio provenance

The prompt's `edge-tts` command is executed first, verbatim
(`en-US-AndrewMultilingualNeural`, `+6%`). This sandbox has **no network route to
`speech.platform.bing.com`**, so the run falls back to a CC0 neural Piper voice
(`en_US-joe-medium`, obtained from npm) reading the *same 283 words*, laid out to
exactly 135.000 s with natural sentence pauses. On a connected machine the Edge
command succeeds and the fallback never runs — `scripts/make_audio.py` prints
which path was used and records it in `src/audio_meta.json`.

## Final render (`out/part_1.mp4`)

```
h264 · 1920×1080 · 60/1 fps · 8100 frames · 135.000 s · 82 MB · 4.9 Mb/s
aac  · 44.1 kHz · mono · 192 kb/s · 135.000 s
```

Frames were sampled out of the encoded file at 3 s, 22 s, 60 s, 90 s, 120 s and
133 s to confirm the three plates, camera moves, captions and the end card all
land as designed.

### Known limitations

* The voice is the offline fallback (see above), not `en-US-AndrewMultilingualNeural`.
* `part1.mp3` is 135.024 s (MP3 frame padding); `part1_mix.wav` and the MP4 are
  hard-trimmed to exactly 135.000 s.
* Longest natural pause is ~2.5 s at the plate 01 → 02 boundary; the whoosh covers it.
