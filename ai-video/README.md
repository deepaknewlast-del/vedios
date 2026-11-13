# Gunkanjima — AI proof-of-concept in the style of *neo*

An 80-second documentary opening built entirely from code, open data and AI
generation, modelling the format of neo's *"Why This Japanese Island is Abandoned"*.

- **Watch:** `out/GUNKANJIMA_poc.mp4` (1920×1080, 30 fps, 1:20)
- **Why/how it was made:** [`ANSWER.md`](ANSWER.md)
- **Thumbnail:** `out/thumbnail.jpg`

## Rebuild

```bash
pip install numpy pillow scipy scikit-image imageio-ffmpeg
cd render
python3 assets_fx.py     # trace the island silhouette + building plan from the photo
python3 audio.py         # synthesise score + sound design, mix with the narration
python3 stills.py        # review contact sheets in /tmp before a long render
python3 render.py        # 1080p render
python3 make_thumbnail.py
```

Rendering is ~9 minutes on 2 vCPU (≈4.4 fps). Audio is ~15 s.

## What is where

| Path | Contents |
|---|---|
| `source-images/` | reference stills of Hashima (aerial, sea wall, ruins, archive) |
| `assets/geo/` | Natural Earth 10m / 50m coastlines (Natural Earth = public domain) |
| `assets/fx/` | traced silhouette, smoothed outline, procedural building plan |
| `audio/vo/` | ten AI narration takes |
| `audio/mix.wav` | score, sound design and voice, ducked and normalised |
| `fonts/ttf/` | Anton, Bebas Neue, Inter, IBM Plex Mono, Noto Sans JP (SIL OFL) |
| `render/core.py` | easing, typography, grade, bloom, grain, shake, Ken Burns |
| `render/shots.py` | the twelve shots — map, silhouette, tracer, archive, counter, title |
| `render/audio.py` | pad, riser, impact, bell, tick, sea, wind, ducking, mix |
| `render/render.py` | frame loop → x264 → mux |

## The look, in five rules

1. **Land dark, coast bright, one amber accent.** Everything else is greyscale.
2. **Two typefaces only:** a condensed poster face for statements, a mono for data.
3. **Move every frame.** Nothing is static — every still pushes or drifts 5–10 %.
4. **Grade for a mood, not for accuracy:** desaturate, cool shadows, warm highlights, grain.
5. **One idea per shot, 4–10 seconds, cut on the breath.**

## Credits / licensing

- Photography is used here as *reference* for a private proof of concept. For a
  published video, licence the stills (Getty / AP / Alamy) or use your own.
- Natural Earth coastline data: public domain.
- Fonts: SIL Open Font License.
- All audio is synthesised by `render/audio.py` — no samples.
