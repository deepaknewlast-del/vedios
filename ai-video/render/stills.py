"""Render review stills (low-res contact sheets) before committing to video."""
import sys
import time
from PIL import Image
from core import W, H, post, fade
import shots

which = sys.argv[1:] if len(sys.argv) > 1 else None
tl, total = shots.timeline()
print("total %.1fs  %d shots" % (total, len(tl)))

for idx, fn, at, dur in tl:
    if which and str(idx) not in which:
        continue
    picks = [0.12, 0.45, 0.85]
    frames = []
    for f in picks:
        t0 = time.time()
        img, _ov = fn(dur * f, dur)
        img = post(img, at + dur * f, grain=5.0, vign=0.85)
        print("  shot%02d @%.2f  %.2fs" % (idx, f, time.time() - t0))
        frames.append(img.resize((W // 2, H // 2), Image.LANCZOS))
    sheet = Image.new("RGB", (W // 2, (H // 2) * len(frames)), (0, 0, 0))
    for i, fr in enumerate(frames):
        sheet.paste(fr, (0, i * (H // 2)))
    sheet.save("/tmp/still_%02d.jpg" % idx, quality=88)
print("done")
