#!/usr/bin/env bash
# Render out/part_1.mp4, frame-locked to the exact ffprobe audio duration.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/toolchain.sh

if [ ! -f public/part1_mix.wav ] || [ ! -f public/part1.mp3 ]; then
  echo "[render] audio missing — generating it first"
  bash scripts/generate-audio.sh
fi

ENV_FILE="$(node scripts/extract-browser.mjs)"
source "$ENV_FILE"

DUR="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 public/part1_mix.wav)"
FRAMES="$(DUR="$DUR" python3 -c 'import os,math; print(int(round(float(os.environ["DUR"])*60)))')"
echo "[render] ffprobe audio duration = ${DUR}s → ${FRAMES} frames @ 60fps"

mkdir -p out
VIDEO="out/part_1_video.mp4"

npx remotion render src/index.ts Part1 "$VIDEO" \
  --frames="0-$((FRAMES-1))" \
  --codec=h264 \
  --crf=20 \
  --concurrency="${REMOTION_CONCURRENCY:-2}" \
  --browser-executable="$REMOTION_BROWSER" \
  --log=info

# Replace the audio stream with the mastered + SFX mix and hard-trim to the
# exact duration reported by ffprobe.
ffmpeg -y -loglevel error \
  -i "$VIDEO" \
  -i public/part1_mix.wav \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 44100 -ac 1 \
  -t "$DUR" -movflags +faststart \
  out/part_1.mp4

echo "[render] verification"
ffprobe -v error -show_entries format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,sample_rate \
  -of default=noprint_wrappers=0 out/part_1.mp4
rm -f "$VIDEO"
echo "[render] done → out/part_1.mp4"
