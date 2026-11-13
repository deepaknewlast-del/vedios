#!/usr/bin/env bash
# Resolves ffmpeg / ffprobe inside the sandbox. The workspace has no system
# ffmpeg and only github.com / npm / pypi are reachable, so we obtain static
# binaries from PyPI (imageio-ffmpeg) and npm (@ffprobe-installer).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! python3 -c "import imageio_ffmpeg" >/dev/null 2>&1; then
  pip3 install --break-system-packages --quiet imageio-ffmpeg
fi
if ! python3 -c "import piper" >/dev/null 2>&1; then
  pip3 install --break-system-packages --quiet piper-tts
fi

FFMPEG_BIN="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')"

FFPROBE_DIR="$ROOT/.cache/ffprobe/node_modules/@ffprobe-installer/linux-x64/ffprobe"
if [ ! -f "$FFPROBE_DIR" ]; then
  npm install --prefix .cache/ffprobe @ffprobe-installer/linux-x64 >/dev/null 2>&1
fi
FFPROBE_BIN="$FFPROBE_DIR"

mkdir -p "$HOME/bin"
ln -sf "$FFMPEG_BIN" "$HOME/bin/ffmpeg"
ln -sf "$FFPROBE_BIN" "$HOME/bin/ffprobe"
export PATH="$HOME/bin:$PATH"
export FFMPEG_BIN FFPROBE_BIN
