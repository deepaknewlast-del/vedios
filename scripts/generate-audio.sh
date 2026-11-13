#!/usr/bin/env bash
# Voiceover + subtitles + -14 LUFS master + lavfi UI cues.
#
#   edge-tts --voice en-US-AndrewMultilingualNeural --rate="+6%" \
#     --text "<SCRIPT>" --write-media public/part1_raw.mp3 \
#     --write-subtitles public/part1.vtt
#   ffmpeg -y -i public/part1_raw.mp3 \
#     -af "highpass=f=85,equalizer=f=3200:t=q:w=1.5:g=2.5,loudnorm=I=-14:TP=-1.5:LRA=11" \
#     public/part1.mp3
#
# (make_audio.py runs those exact commands; it falls back to an offline neural
# voice when Microsoft's TTS host is unreachable.)
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/toolchain.sh
python3 scripts/make_audio.py
