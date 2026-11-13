"""Generate a neo-style thumbnail: silhouette key art + condensed type."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import shots
from core import W, H, INK, BONE, AMBER, post, text, label, F_TITLE, F_MONO, F_JP

pol = shots.island_poly(1210, 520, 980, 19)
m = Image.new("L", (W, H), 0)
ImageDraw.Draw(m).polygon([tuple(p) for p in pol], fill=255)
m = m.filter(ImageFilter.GaussianBlur(0.6))

a = np.zeros((H, W, 3), dtype=np.float32) + np.array([13, 16, 21], dtype=np.float32)
yy, xx = np.mgrid[0:H, 0:W]
a[(xx % 40 == 0) & (yy % 40 == 0)] = np.array([34, 42, 50], dtype=np.float32)
# warm glow behind the island
g = np.exp(-(((xx - 1180) / 700) ** 2 + ((yy - 560) / 520) ** 2)).astype(np.float32)
a += np.array([38, 26, 10], dtype=np.float32) * g[..., None]
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

shape = Image.new("RGB", (W, H), (245, 239, 227))
img = Image.composite(shape, img, m)

ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(ov)
label(d, 86, 150, "JAPAN  ·  1974", AMBER, 17, 4.0)
text(d, (80, 344), "THE ISLAND", F_TITLE, 138, BONE, tracking=2)
text(d, (80, 486), "EVERYONE", F_TITLE, 138, BONE, tracking=2)
text(d, (80, 628), "LEFT BEHIND", F_TITLE, 138, AMBER, tracking=2)
text(d, (86, 742), "GUNKANJIMA", F_MONO, 21, BONE, tracking=6)
text(d, (392, 742), "端島", F_JP, 21, AMBER, tracking=4)
final = Image.alpha_composite(img.convert("RGBA"), ov).convert("RGB")
final = post(final, 1.0, grain=4.0, vign=0.7)
final.save("ai-video/out/thumbnail.jpg", quality=92)
print("ok", final.size)
