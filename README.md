# Theory of Behaviour — Part 1

> *"Why Being Too Competent Makes People Secretly Resent You"*
> Part 1 of 4 · **2:15 @ 1920×1080 / 60 fps** · Remotion

A 1980s retro behavioral-textbook explainer. Every visual is crisp vector
SVG/HTML built in code — no stock footage, no photography, and **zero stick
figures**: only dossiers, CRT wireframes, matrix cells, arrows and stamps.

```
out/part_1.mp4        ← final render (8100 frames, -14 LUFS, 60 fps)
public/part1.mp3      ← mastered voiceover
public/part1.vtt      ← word-level subtitles
public/part1_mix.wav  ← voiceover + UI cues (used by the render)
```

## Structure

| Plate | Time | Content |
|---|---|---|
| `01` | `0:00 – 0:34` | **Hook comparison panel** — CANDIDATE A `100% FLAWLESS` stamped `THREAT`, CANDIDATE B `88% + MINOR FLAW` stamped `TRUSTED`, chunky directional arrows |
| `02` | `0:34 – 1:20` | **1966 lab wireframe** — beige CRT / tape deck, audio waveform, `QUIZ SCORE: 92%`, dashed zoom-out callout (`strokeDasharray="6 4"`) with the toppled cup, likability bars jumping `+34%` |
| `03` | `1:20 – 2:15` | **2×2 competence × warmth matrix** — `HIGH COMPETENCE + ZERO FLAWS` lands in the `#E39A83` `ENVY / COLD` trap; the strategic flaw migrates the plot into the `#8BB8B8` `ADMIRATION` cell |

## Design system (`src/theme.ts`)

| Token | Value |
|---|---|
| Paper | `#F4EFE2` with `32px` grid `#E0D8C8` (plus a `160px` major grid) |
| Ink | `#181818` · borders `3px solid` · hard shadows `4px 4px 0px` |
| Sage teal | `#8BB8B8` / `#B8D6D4` |
| Terracotta | `#E39A83` |
| Mustard | `#F2CA6B` |
| Hardware grey | `#D3D5D4` |
| Alert red | `#E03C31` |

* Headers: **Comic Neue 700 italic** + black square number badges `[ 1 ] [ 2 ] [ 3 ]`
* Data, matrix labels, tags: **Space Mono 700**
* Film grain: tileable `public/grain.png`, re-offset every frame
* A new visual state (or camera zoom/pan) lands **every 3.5–5 s** — 32 beats total,
  each keyed to the narration line it illustrates

## Commands

```bash
npm install          # Remotion + fonts + local Chromium
npm run audio        # voiceover, VTT, -14 LUFS master, lavfi UI cues
npm run studio       # live preview at http://localhost:3000
npm run render       # → out/part_1.mp4
npm run typecheck
```

## Audio pipeline (`scripts/make_audio.py`)

1. `edge-tts --voice en-US-AndrewMultilingualNeural --rate="+6%" --write-media public/part1_raw.mp3 --write-subtitles public/part1.vtt`
2. `ffmpeg -y -i public/part1_raw.mp3 -af "highpass=f=85,equalizer=f=3200:t=q:w=1.5:g=2.5,loudnorm=I=-14:TP=-1.5:LRA=11" public/part1.mp3`
3. Finishing stage so the delivered file actually measures **-14.2 LUFS**
   (one-pass `loudnorm` alone under-shoots this source at ≈ -17 LUFS)
4. Mechanical **click** (`sine 1650 Hz` + noise burst, 60 ms) and tape **whoosh**
   (`anoisesrc` pink, 650 ms) generated with `ffmpeg` lavfi, then delayed onto the
   exact beat boundaries and mixed under the voice at -19 dB / -21 dB

> **Note on the voice.** This sandbox has no route to
> `speech.platform.bing.com`, so the requested Andrew voice cannot be fetched
> here. The script falls back to a **CC0 neural Piper voice**
> (`en_US-joe-medium`, distributed as an npm package) that reads the *exact same
> 283-word script*, and emits an equivalent **word-level VTT**. On any machine
> with network access the Edge TTS command runs first and the fallback is
> skipped — nothing else in the pipeline changes.

The narration is laid out so speech + natural pauses land on exactly
**135.000 s = 8100 frames**; the render is frame-locked to that `ffprobe` value.

## Notes for the render

Remotion needs Chrome. There is no system browser and no Google CDN access, so
`scripts/extract-browser.mjs` unpacks the Chromium bundled in `@sparticuz/chromium`
(plus its NSS libraries) into `.cache/chromium`. `scripts/render.sh` wires it up
via `--browser-executable` and `LD_LIBRARY_PATH`, renders the video, then muxes the
mastered mix and trims to the exact `ffprobe` duration.
