"""Build a clean silhouette + procedural building plan from the aerial plate.

The aerial photo is shot at a low angle, so we use it to derive a bold, keyable
top-down silhouette (exactly the graphic device the channel uses) and then lay a
stylised architectural plan inside it for the map animation.
"""
import os
import json
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
from scipy import ndimage
from skimage import measure
from core import SRC, ROOT

OUT = os.path.join(ROOT, "assets", "fx")
os.makedirs(OUT, exist_ok=True)


def raw_mask(name="aerial_island.jpg"):
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    r, b = a[..., 0], a[..., 2]
    mx, mn = a.max(axis=2), a.min(axis=2)
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1e-6), 0)
    sea = (b > r + 0.045) & (b > 0.13) & (sat > 0.30)
    sea = ndimage.binary_opening(sea, np.ones((5, 5)))
    land = ~ndimage.binary_closing(sea, np.ones((9, 9)))
    land = ndimage.binary_opening(land, np.ones((9, 9)))
    lbl, n = ndimage.label(land)
    if n > 1:
        sizes = ndimage.sum(land, lbl, range(1, n + 1))
        land = lbl == (int(np.argmax(sizes)) + 1)
    land = ndimage.binary_fill_holes(land)
    ys, xs = np.nonzero(land)
    pad = 10
    x0, y0 = max(0, xs.min() - pad), max(0, ys.min() - pad)
    x1, y1 = min(land.shape[1], xs.max() + pad), min(land.shape[0], ys.max() + pad)
    return land[y0:y1, x0:x1]


def smooth_mask(m, sigma=3.0):
    f = ndimage.gaussian_filter(m.astype(np.float32), sigma)
    m2 = f > 0.5
    m2 = ndimage.binary_fill_holes(m2)
    m2 = ndimage.binary_closing(m2, np.ones((7, 7)))
    m2 = ndimage.binary_fill_holes(m2)
    return m2


def polygon_of(m, tol=2.2):
    m = np.pad(m.astype(np.uint8), 2)
    cs = measure.find_contours(m, 0.5)
    cs.sort(key=len, reverse=True)
    c = cs[0]
    c = measure.approximate_polygon(c, tolerance=tol)
    poly = np.stack([c[:, 1] - 2, c[:, 0] - 2], axis=1).astype(np.float32)
    return poly


def build_plan(poly, w, h, seed=3):
    """Stylised blocks + sea wall inside the silhouette."""
    rng = np.random.default_rng(seed)
    img = Image.new("L", (w, h), 0)
    ImageDraw.Draw(img).polygon([tuple(p) for p in poly], fill=255)
    inside = np.asarray(img) > 127
    inner = ndimage.binary_erosion(inside, np.ones((26, 26)))
    inner_img = Image.fromarray((inner * 255).astype(np.uint8))
    d = ImageDraw.Draw(inner_img)

    blocks = []
    # rotate a layout grid to follow the island's long axis
    ang = np.deg2rad(-19)
    ca, sa = np.cos(ang), np.sin(ang)
    cx, cy = w / 2, h / 2

    def to_world(px, py):
        return (cx + px * ca - py * sa, cy + px * sa + py * ca)

    # density falls off toward the sea wall; leave the rocky spine open
    spine = (cx + 10, cy)  # reserve rocky centre for the mine
    for gy in range(-18, 19):
        for gx in range(-30, 31):
            px = gx * 30 + rng.uniform(-4, 4)
            py = gy * 26 + rng.uniform(-3, 3)
            # rocky hill exclusion (ellipse)
            if ((px + 38) / 210) ** 2 + ((py - 10) / 128) ** 2 < 1.0:
                continue
            wx, wy = to_world(px, py)
            if not (0 <= wx < w and 0 <= wy < h):
                continue
            if not inner[int(wy), int(wx)]:
                continue
            dens = rng.random()
            if dens > 0.55:
                continue
            bw = rng.choice([30, 40, 52, 66], p=[0.40, 0.30, 0.20, 0.10]) * rng.uniform(0.85, 1.15)
            bh = rng.choice([18, 24, 32], p=[0.45, 0.38, 0.17]) * rng.uniform(0.85, 1.15)
            corners = [to_world(px - bw / 2, py - bh / 2), to_world(px + bw / 2, py - bh / 2),
                       to_world(px + bw / 2, py + bh / 2), to_world(px - bw / 2, py + bh / 2)]
            d.polygon(corners, fill=int(rng.uniform(150, 255)))
            blocks.append({"c": [(c[0] / w, c[1] / h) for c in corners],
                           "tone": float(rng.uniform(0.45, 1.0))})

    plan = np.asarray(inner_img).astype(np.float32) / 255.0
    return plan, blocks


if __name__ == "__main__":
    m = raw_mask()
    ms = smooth_mask(m)
    print("mask", ms.shape, "coverage %.3f" % ms.mean())
    w, h = ms.shape[1], ms.shape[0]
    poly = polygon_of(ms, tol=2.0)
    print("polygon pts", len(poly), "aspect %.3f" % (w / h))

    # normalised outline for the tracer animation
    norm = poly / np.array([w, h], dtype=np.float32)
    json.dump({"points": norm.tolist(), "aspect": w / h},
              open(os.path.join(OUT, "hashima_outline.json"), "w"))

    plan, blocks = build_plan(poly, w, h)
    print("blocks", len(blocks))
    json.dump({"blocks": blocks, "aspect": w / h},
              open(os.path.join(OUT, "hashima_blocks.json"), "w"))

    # export a hi-res silhouette + plan as PNG masks (2x for smooth scaling)
    S = 2
    sil = Image.fromarray((ms * 255).astype(np.uint8)).resize((w * S, h * S), Image.LANCZOS)
    sil.save(os.path.join(OUT, "hashima_mask.png"))
    pl = Image.fromarray((plan * 255).astype(np.uint8)).resize((w * S, h * S), Image.LANCZOS)
    pl.save(os.path.join(OUT, "hashima_plan.png"))

    # preview
    prev = Image.new("RGB", (w, h), (8, 12, 18))
    prev.paste((20, 30, 40), (0, 0), Image.fromarray((ms * 255).astype(np.uint8)))
    prev.paste((226, 170, 80), (0, 0), Image.fromarray((plan * 230).astype(np.uint8)))
    prev.save("/tmp/plan_preview.png")
    print("saved")
