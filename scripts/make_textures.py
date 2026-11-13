#!/usr/bin/env python3
"""Bake the 1980s textbook paper into single bitmap layers.

CSS-tiled gradients (32px grid over 1920×1080 ≈ 2000 tiles) force Chromium to
re-rasterise the whole plate every frame. Pre-rendering the same design into
two PNGs keeps the look identical and makes rendering ~10× faster.
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

W, H = 1920, 1080
PUBLIC = Path(__file__).resolve().parents[1] / "public"

PAPER = (244, 239, 226)
GRID = (224, 216, 200)
INK = (24, 24, 24)


def make_paper() -> Image.Image:
    img = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(img, "RGBA")

    # minor 32px grid
    for x in range(0, W + 1, 32):
        draw.line([(x, 0), (x, H)], fill=GRID + (210,), width=1)
    for y in range(0, H + 1, 32):
        draw.line([(0, y), (W, y)], fill=GRID + (210,), width=1)

    # major 160px grid
    for x in range(0, W + 1, 160):
        draw.line([(x, 0), (x, H)], fill=INK + (28,), width=1)
    for y in range(0, H + 1, 160):
        draw.line([(0, y), (W, y)], fill=INK + (28,), width=1)

    # age stains
    stains = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(stains)
    for cx, cy, r, a in [
        (230, 150, 330, 26),
        (1690, 910, 380, 24),
        (1180, 120, 240, 13),
        (420, 940, 300, 17),
    ]:
        sdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(168, 124, 72, a))
    stains = stains.filter(ImageFilter.GaussianBlur(90))
    img = Image.alpha_composite(img.convert("RGBA"), stains).convert("RGB")

    # vignette
    vign = Image.new("L", (W, H), 0)
    vdraw = ImageDraw.Draw(vign)
    vdraw.ellipse([-380, -300, W + 380, H + 300], fill=255)
    vign = vign.filter(ImageFilter.GaussianBlur(220))
    dark = Image.new("RGB", (W, H), (107, 84, 51))
    img = Image.composite(img, Image.blend(img, dark, 0.16), vign)

    # centre fold
    fold = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fold)
    fdraw.line([(0, int(H * 0.497)), (W, int(H * 0.497))], fill=(138, 115, 80, 26), width=3)
    img = Image.alpha_composite(img.convert("RGBA"), fold).convert("RGB")
    return img


def make_grain() -> Image.Image:
    import random

    random.seed(1966)
    w = h = 320
    grain = Image.new("RGBA", (w, h))
    px = grain.load()
    for y in range(h):
        for x in range(w):
            n = random.random()
            v = int(n ** 3 * 96)
            px[x, y] = (24, 24, 24, v)
    return grain


if __name__ == "__main__":
    PUBLIC.mkdir(exist_ok=True)
    make_paper().save(PUBLIC / "paper.png", optimize=True)
    make_grain().save(PUBLIC / "grain.png", optimize=True)
    print("paper.png", (PUBLIC / "paper.png").stat().st_size // 1024, "KB")
    print("grain.png", (PUBLIC / "grain.png").stat().st_size // 1024, "KB")
