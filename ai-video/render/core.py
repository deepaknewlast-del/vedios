"""Core helpers: timing, easing, typography, drawing, image treatment."""
import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1920, 1080
FPS = 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "fonts", "ttf")
SRC = os.path.join(ROOT, "source-images")

# ---------------------------------------------------------------- palette
INK = (10, 13, 17)
BONE = (236, 230, 218)
BONE_DIM = (183, 180, 172)
AMBER = (232, 163, 61)
AMBER_HI = (255, 204, 128)
STEEL = (127, 182, 200)
RED = (198, 78, 58)


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return a if x < a else (b if x > b else x)


def lerp(a, b, t):
    return a + (b - a) * t


def smooth(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def ease_out(t, p=3):
    t = clamp(t)
    return 1 - (1 - t) ** p


def ease_in(t, p=3):
    t = clamp(t)
    return t ** p


def ease_io(t):
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out_expo(t):
    t = clamp(t)
    return 1 if t >= 1 else 1 - 2 ** (-10 * t)


def rev(t, start, dur=0.45, ease=smooth):
    """Progress 0..1 of a reveal that begins at `start`."""
    if dur <= 0:
        return 1.0 if t >= start else 0.0
    return ease((t - start) / dur)


def pulse(t, start, dur=1.2, times=2):
    """Repeating expanding-ring progress, returns list of ring progresses."""
    out = []
    if t < start:
        return out
    for i in range(times):
        p = (t - start - i * dur / times) / (dur / times)
        if 0 <= p <= 1:
            out.append(p)
    return out


# ---------------------------------------------------------------- fonts
_font_cache = {}


def font(name, size):
    key = (name, int(size))
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(os.path.join(FONTS, name), int(size))
    return _font_cache[key]


F_TITLE = "Anton.ttf"
F_COND = "BebasNeue.ttf"
F_UI = "Inter-latin-500-normal.ttf"
F_UI_B = "Inter-latin-600-normal.ttf"
F_UI_XB = "Inter-latin-700-normal.ttf"
F_MONO = "PlexMono-latin-400-normal.ttf"
F_MONO_M = "PlexMono-latin-500-normal.ttf"
F_JP = "NotoSansJP-700.ttf"


def _mix(a, b, t):
    return tuple(int(round(lerp(a[i], b[i], t))) for i in range(len(a)))


def text(d, xy, s, fnt, size, fill=BONE, tracking=0.0, alpha=255, anchor="ls",
         align="left"):
    """Draw text with letter-spacing. anchor: 'ls' left-baseline, 'ms', 'rs',
    'lt' left-top, 'mt', 'rt', 'mm' (middle-middle), 'lm', 'rm'."""
    f = font(fnt, size)
    if alpha <= 1 or not s:
        return 0.0
    col = tuple(fill[:3]) + (int(clamp(alpha, 0, 255)),)
    if tracking == 0:
        d.text(xy, s, font=f, fill=col, anchor=anchor)
        return d.textlength(s, font=f)
    widths = [d.textlength(ch, font=f) for ch in s]
    total = sum(widths) + tracking * (len(s) - 1)
    x, y = xy
    if anchor[0] == "m":
        x -= total / 2
    elif anchor[0] == "r":
        x -= total
    for i, ch in enumerate(s):
        d.text((x, y), ch, font=f, fill=col, anchor="l" + anchor[1])
        x += widths[i] + tracking
    return total


def text_width(d, s, fnt, size, tracking=0.0):
    f = font(fnt, size)
    if tracking == 0:
        return d.textlength(s, font=f)
    return sum(d.textlength(ch, font=f) for ch in s) + tracking * max(0, len(s) - 1)


def wrap(d, s, fnt, size, max_w, tracking=0.0):
    words = s.split()
    lines, cur = [], ""
    for w_ in words:
        trial = (cur + " " + w_).strip()
        if text_width(d, trial, fnt, size, tracking) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = w_
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- imaging
def load_plate(name, width=2400):
    im = Image.open(os.path.join(SRC, name)).convert("RGB")
    if im.width < width:
        im = im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)
    return grade(im)


def grade(im, desat=0.24, contrast=0.14, lift=(0.006, 0.004, 0.012),
          gain=(1.045, 1.0, 0.965), shadow_tint=(0.90, 0.97, 1.06),
          highlight_tint=(1.03, 1.0, 0.95)):
    """Cinematic grade: desaturate, contrast S-curve, split-tone, lift/gain."""
    a = np.asarray(im).astype(np.float32) / 255.0
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    a = lum[..., None] + (a - lum[..., None]) * (1.0 - desat)

    a = np.clip((a + lift) * np.array(gain, dtype=np.float32), 0, 1)
    # contrast S-curve
    a = np.clip(0.5 + (a - 0.5) * (1.0 + contrast), 0, 1)
    a = a * a * (3 - 2 * a) * 0.35 + a * 0.65          # gentle toe/shoulder

    l2 = np.clip(a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32), 0, 1)[..., None]
    sh = np.clip(1.0 - l2 * 2.0, 0, 1) ** 2
    hi = np.clip((l2 - 0.5) * 2.0, 0, 1) ** 1.5
    a = a * (1 + (np.array(shadow_tint) - 1) * sh) * (1 + (np.array(highlight_tint) - 1) * hi)

    # halation / bloom map for later compositing
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def bloom_layer(plate, thresh=176, radius=26, strength=0.55):
    a = np.asarray(plate).astype(np.float32)
    lum = a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    m = np.clip((lum - thresh) / (255.0 - thresh), 0, 1) ** 1.4
    glow = (a * m[..., None]).astype(np.uint8)
    g = Image.fromarray(glow).filter(ImageFilter.GaussianBlur(radius))
    return g


class Plate:
    """A graded still with a precomputed (half-res) bloom, rendered as a moving crop."""

    def __init__(self, name, width=2200, blur=20, bloom_strength=0.5, upscale=None,
                 max_up=2.8):
        im = Image.open(os.path.join(SRC, name)).convert("RGB")
        target = int(width if upscale is None else im.width * upscale)
        target = min(max(target, im.width), int(im.width * max_up))
        if abs(target - im.width) > 2:
            im = im.resize((target, int(im.height * target / im.width)), Image.LANCZOS)
        self.img = grade(im)
        self.w, self.h = self.img.size
        self.bloom = None
        self.bloom_s = bloom_strength
        if bloom_strength > 0:
            small = self.img.resize((self.w // 2, self.h // 2), Image.BILINEAR)
            b = bloom_layer(small, radius=blur, thresh=170)
            self.bloom = b
            self.half = (self.w // 2, self.h // 2)

    def crop(self, cx, cy, scale, out=(W, H), ar=None):
        """cx, cy in 0..1 plate coords; scale = fraction of plate height shown."""
        ar = ar or (out[0] / out[1])
        ch = self.h * scale
        cw = ch * ar
        if cw > self.w:
            cw = self.w
            ch = cw / ar
        x0 = min(max(cx * self.w - cw / 2, 0), self.w - cw)
        y0 = min(max(cy * self.h - ch / 2, 0), self.h - ch)
        box = (x0, y0, x0 + cw, y0 + ch)
        base = self.img.resize(out, Image.BILINEAR, box=box)
        if self.bloom is not None and self.bloom_s > 0:
            hw, hh = self.half
            bb = (x0 * hw / self.w, y0 * hh / self.h,
                  (x0 + cw) * hw / self.w, (y0 + ch) * hh / self.h)
            bl = self.bloom.resize(out, Image.BILINEAR, box=bb)
            base = Image.blend(base, bl, self.bloom_s)
        return base


def kenburns(plate, t, dur, start, end, out=(W, H), ease=ease_io):
    p = ease(clamp(t / dur))
    cx = lerp(start[0], end[0], p)
    cy = lerp(start[1], end[1], p)
    sc = lerp(start[2], end[2], p)
    return plate.crop(cx, cy, sc, out)


# ---------------------------------------------------------------- post FX
def _noise_tiles(n=8, size=512):
    rng = np.random.default_rng(7)
    return [rng.normal(0, 1, (size, size, 1)).astype(np.float32) for _ in range(n)]


NOISE = _noise_tiles()
_VIG = None


def vignette():
    global _VIG
    if _VIG is None:
        y, x = np.mgrid[0:H, 0:W].astype(np.float32)
        nx = (x - W / 2) / (W / 2)
        ny = (y - H / 2) / (H / 2)
        r = np.sqrt(nx ** 2 * 0.82 + ny ** 2)
        v = np.clip(1.0 - 0.42 * np.clip(r - 0.42, 0, None) ** 1.6, 0.0, 1.0)
        _VIG = v.astype(np.float32)[..., None]
    return _VIG


def post(img, t, grain=7.0, vign=0.95, ca=0.0, lift=0.0, desat=0.0, seed=0):
    """Film-style finishing: chroma aberration, grain, vignette, lift."""
    a = np.asarray(img).astype(np.float32)
    if ca > 0:
        sh = int(round(ca))
        if sh:
            a[..., 0] = np.roll(a[..., 0], sh, axis=1)
            a[..., 2] = np.roll(a[..., 2], -sh, axis=1)
    if desat > 0:
        lum = (a @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
        a = lum + (a - lum) * (1 - desat)
    if grain > 0:
        tile = NOISE[(int(t * 24) + seed) % len(NOISE)]
        oy = int((t * 917) % 400)
        ox = int((t * 631) % 400)
        g = np.roll(np.roll(tile, oy, axis=0), ox, axis=1)
        g = np.tile(g, (4, 4, 1))[:H, :W, :]
        a = a + g * grain
    if vign > 0:
        a = a * (1 - (1 - vignette()) * vign)
    if lift:
        a = a * (1 - lift) + 255 * lift * 0.02
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def shake(img, t, hit, amp=9.0, decay=7.0):
    """Quick decaying camera shake after an impact."""
    d = t - hit
    if d < 0 or d > 1.2:
        return img
    e = amp * math.exp(-d * decay)
    dx = int(round(math.sin(d * 61.0) * e))
    dy = int(round(math.cos(d * 47.0) * e * 0.7))
    if dx == 0 and dy == 0:
        return img
    a = np.asarray(img)
    a = np.roll(np.roll(a, dy, axis=0), dx, axis=1)
    return Image.fromarray(a)


def fade(img, k):
    if k >= 1:
        return img
    if k <= 0:
        return Image.new("RGB", img.size, INK)
    return Image.blend(Image.new("RGB", img.size, INK), img, k)


def solid(color=INK):
    return Image.new("RGB", (W, H), color)


def overlay():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def comp(base, *layers):
    for l in layers:
        if l is not None:
            base = Image.alpha_composite(base.convert("RGBA"), l).convert("RGB")
    return base


# ---------------------------------------------------------------- primitives
def hline(d, x0, x1, y, fill=BONE, alpha=200, width=1):
    d.line([(x0, y), (x1, y)], fill=tuple(fill[:3]) + (int(alpha),), width=width)


def vline(d, x, y0, y1, fill=BONE, alpha=200, width=1):
    d.line([(x, y0), (x, y1)], fill=tuple(fill[:3]) + (int(alpha),), width=width)


def dashed(d, x0, y0, x1, y1, fill=BONE, alpha=200, dash=10, gap=8, width=1):
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy)
    if L == 0:
        return
    ux, uy = dx / L, dy / L
    s = 0.0
    while s < L:
        e = min(s + dash, L)
        d.line([(x0 + ux * s, y0 + uy * s), (x0 + ux * e, y0 + uy * e)],
               fill=tuple(fill[:3]) + (int(alpha),), width=width)
        s = e + gap


def dashed_rect(d, box, fill=BONE, alpha=180, dash=9, gap=7, width=1):
    x0, y0, x1, y1 = box
    dashed(d, x0, y0, x1, y0, fill, alpha, dash, gap, width)
    dashed(d, x1, y0, x1, y1, fill, alpha, dash, gap, width)
    dashed(d, x1, y1, x0, y1, fill, alpha, dash, gap, width)
    dashed(d, x0, y1, x0, y0, fill, alpha, dash, gap, width)


def corners(d, box, size=22, fill=BONE, alpha=230, width=2):
    x0, y0, x1, y1 = box
    c = tuple(fill[:3]) + (int(alpha),)
    for (px, py, sx, sy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
        d.line([(px, py), (px + sx * size, py)], fill=c, width=width)
        d.line([(px, py), (px, py + sy * size)], fill=c, width=width)


def label(d, x, y, s, color=BONE, size=15, tracking=2.4, fnt=F_MONO_M, alpha=210,
          anchor="ls", tick=True):
    """Small mono caps label with optional leading tick."""
    if tick:
        d.line([(x, y - 5), (x + 13, y - 5)], fill=tuple(color[:3]) + (int(alpha),), width=2)
        x += 23
    text(d, (x, y), s, fnt, size, fill=color, tracking=tracking, alpha=alpha, anchor=anchor)


def dot(d, x, y, r, fill=AMBER, alpha=255):
    d.ellipse([x - r, y - r, x + r, y + r], fill=tuple(fill[:3]) + (int(alpha),))


def pin(d, x, y, fill=AMBER, alpha=255, r=5.5):
    dot(d, x, y, r, fill, alpha)
    dot(d, x, y, r * 0.42, BONE, alpha)


def rings(d, x, y, t, start, dur=1.1, count=2, color=AMBER, rmax=110, width=2, alpha=190):
    for i, p in enumerate(pulse(t, start, dur, count)):
        e = ease_out(p, 2)
        r = 6 + rmax * e
        a = alpha * (1 - e) ** 1.3
        if a > 2:
            d.ellipse([x - r, y - r, x + r, y + r], outline=tuple(color[:3]) + (int(a),),
                      width=max(1, int(width * (1 - e * 0.6))))


def crosshair(d, x, y, r=26, color=BONE, alpha=170, width=1, gap=8):
    c = tuple(color[:3]) + (int(alpha),)
    d.line([(x - r, y), (x - gap, y)], fill=c, width=width)
    d.line([(x + gap, y), (x + r, y)], fill=c, width=width)
    d.line([(x, y - r), (x, y - gap)], fill=c, width=width)
    d.line([(x, y + gap), (x, y + r)], fill=c, width=width)


def scrim(img, box=None, color=INK, strength=0.55, feather=140, side="bottom"):
    """Darken part of the frame for text legibility."""
    a = np.asarray(img).astype(np.float32)
    h, w = a.shape[:2]
    if box is None:
        y = np.arange(h).astype(np.float32) / h
        if side == "bottom":
            m = (np.clip((y - (1 - strength * 1.8)) / (strength * 1.8), 0, 1) ** 1.5)
        elif side == "top":
            m = (np.clip(((strength * 1.8) - y) / (strength * 1.8), 0, 1) ** 1.5)
        else:
            m = np.ones(h, dtype=np.float32) * strength
        a *= (1 - m[:, None, None] * np.array(color, dtype=np.float32) / 255.0)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def shader_stripes(img, box, alpha=40, step=6):
    a = np.asarray(img).astype(np.float32)
    x0, y0, x1, y1 = [int(v) for v in box]
    y = np.arange(y0, y1)
    mask = ((y // step) % 2 == 0).astype(np.float32)[:, None, None] * alpha / 255.0
    a[y0:y1, x0:x1] = a[y0:y1, x0:x1] * (1 - mask * 0.5)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
