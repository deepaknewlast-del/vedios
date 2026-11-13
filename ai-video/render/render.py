"""Render the film: frames -> libx264 via ffmpeg stdin, then mux with the mix.

usage: python3 render.py [--out file.mp4] [--start s] [--end s] [--scale 1.0]
"""
import argparse
import math
import os
import subprocess
import sys
import time

import imageio_ffmpeg
import numpy as np
from PIL import Image

import shots
from core import W, H, FPS, post, ROOT

FF = imageio_ffmpeg.get_ffmpeg_exe()


def frames_for_shots(only=None):
    tl, total = shots.timeline()
    return tl, total


def render(out_path, start=0.0, end=None, crf=18, preset="veryfast", scale=1.0):
    tl, total = shots.timeline()
    end = min(end or total, total)
    f0 = int(round(start * FPS))
    f1 = int(round(end * FPS))
    n = f1 - f0
    w, h = int(W * scale) // 2 * 2, int(H * scale) // 2 * 2
    print("rendering %d frames (%.1fs) -> %s" % (n, n / FPS, out_path))

    cmd = [FF, "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", "%dx%d" % (W, H), "-r", str(FPS), "-i", "-",
           "-an", "-vf", "scale=%d:%d:flags=lanczos" % (w, h),
           "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-x264-params", "keyint=60:min-keyint=30:scenecut=0",
           out_path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                         stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

    shot_i = 0
    t0 = time.time()
    for i in range(f0, f1):
        gt = i / FPS
        while shot_i + 1 < len(tl) and gt >= tl[shot_i + 1][2]:
            shot_i += 1
        idx, fn, at, dur = tl[shot_i]
        lt = min(gt - at, dur - 1.0 / FPS)
        img, _ov = fn(max(0.0, lt), dur)

        # global finishing
        fade_in = min(1.0, gt / 0.9)
        fade_out = min(1.0, max(0.0, (total - gt) / 1.4))
        img = post(img, gt, grain=6.0, vign=0.85, ca=0.0)
        k = min(fade_in, fade_out)
        if k < 1.0:
            img = Image.blend(Image.new("RGB", (W, H), (6, 8, 11)), img, k)

        p.stdin.write(np.asarray(img, dtype=np.uint8).tobytes())
        if (i - f0) % 150 == 0:
            el = time.time() - t0
            done = i - f0 + 1
            eta = el / done * (n - done)
            print("  %4d/%d  %.1f fps  eta %4.0fs  (shot %02d)" %
                  (done, n, done / max(el, 1e-6), eta, idx), flush=True)

    p.stdin.close()
    err = p.stderr.read().decode()
    p.wait()
    if p.returncode != 0:
        print(err[-3000:])
        raise SystemExit("ffmpeg failed")
    print("video ok in %.1fs" % (time.time() - t0))


def mux(video, audio, out, total):
    cmd = [FF, "-y", "-v", "error", "-i", video, "-i", audio,
           "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
           "-c:a", "aac", "-b:a", "192k", "-shortest",
           "-movflags", "+faststart", out]
    subprocess.run(cmd, check=True)
    print("muxed ->", out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(ROOT, "out", "render.mp4"))
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=None)
    ap.add_argument("--crf", type=int, default=18)
    ap.add_argument("--preset", default="veryfast")
    ap.add_argument("--scale", type=float, default=1.0)
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    render(a.out, a.start, a.end, a.crf, a.preset, a.scale)
