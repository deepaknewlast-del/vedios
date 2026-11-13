"""Shot library. Every shot is render(t, dur) -> (PIL RGB frame, PIL RGBA overlay)."""
import json
import math
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from core import *

# ---------------------------------------------------------------- asset access
_geo = {}
_outline = None
_blocks = None
_plates = {}
_meta = None


def meta():
    global _meta
    if _meta is None:
        _meta = json.load(open(os.path.join(ROOT, "assets", "fx", "hashima_outline.json")))
    return _meta


def geo(res="10m"):
    if res not in _geo:
        fc = json.load(open(os.path.join(ROOT, "assets", "geo", "japan_%s.json" % res)))
        rings = []
        for f in fc["features"]:
            cs = f["geometry"]["coordinates"]
            if f["geometry"]["type"] == "Polygon":
                cs = [cs]
            for poly in cs:
                for ring in poly:
                    if len(ring) >= 4:
                        rings.append(np.array(ring, dtype=np.float32))
        _geo[res] = rings
    return _geo[res]


def outline():
    global _outline
    if _outline is None:
        p = np.array(meta()["points"], dtype=np.float32)
        for _ in range(2):
            q = []
            for i in range(len(p)):
                a, b = p[i], p[(i + 1) % len(p)]
                q.append(a * 0.75 + b * 0.25)
                q.append(a * 0.25 + b * 0.75)
            p = np.array(q, dtype=np.float32)
        _outline = p
    return _outline


def blocks():
    global _blocks
    if _blocks is None:
        _blocks = json.load(open(os.path.join(ROOT, "assets", "fx", "hashima_blocks.json")))["blocks"]
    return _blocks


def plate(name, **kw):
    key = (name, tuple(sorted(kw.items())))
    if key not in _plates:
        _plates[key] = Plate(name, **kw)
    return _plates[key]


def island_poly(cx, cy, width, rot=19.0):
    p = outline()
    w = width
    h = width / meta()["aspect"]
    a = math.radians(rot)
    ca, sa = math.cos(a), math.sin(a)
    x = (p[:, 0] - 0.5) * w
    y = (p[:, 1] - 0.5) * h
    return np.stack([cx + x * ca - y * sa, cy + x * sa + y * ca], axis=1)


def proj(lon, lat, cx, cy, scale):
    return cx + (lon - 129.9) * scale, cy - (lat - 32.75) * scale * 1.22


def darken(img, k=0.5, tint=(1.0, 1.0, 1.0)):
    a = np.asarray(img).astype(np.float32) * k * np.array(tint, dtype=np.float32)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def duotone(img, dark=(8, 14, 20), light=(226, 231, 229), gamma=1.0):
    g = np.asarray(img.convert("L")).astype(np.float32) / 255.0
    g = np.clip(g ** gamma, 0, 1)[..., None]
    d = np.array(dark, dtype=np.float32)
    l = np.array(light, dtype=np.float32)
    return Image.fromarray(np.clip(d + (l - d) * g, 0, 255).astype(np.uint8))


def layer():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


# ================================================================ map engine
SEA = np.array([9, 14, 20], dtype=np.float32)

def map_render(coast, cx, cy, scale, t, land=(78, 92, 99), glow=0.55, sub=True):
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    for r in coast:
        rr = r
        if sub and scale > 300 and len(r) < 900:
            q = []
            for i in range(len(r) - 1):
                a, b = r[i], r[i + 1]
                q.append(a * 0.75 + b * 0.25)
                q.append(a * 0.25 + b * 0.75)
            q.append(np.array(r[-1], dtype=np.float32))
            rr = np.array(q, dtype=np.float32)
        xs, ys = proj(rr[:, 0], rr[:, 1], cx, cy, scale)
        if xs.max() < -40 or xs.min() > W + 40 or ys.max() < -40 or ys.min() > H + 40:
            continue
        d.polygon(list(zip(xs.tolist(), ys.tolist())), fill=255)

    mask = np.asarray(m.filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32) / 255.0
    soft = np.asarray(m.filter(ImageFilter.GaussianBlur(9))).astype(np.float32) / 255.0
    edge = np.clip(soft - mask, 0, 1)

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = SEA[None, None, :] + np.zeros((H, W, 3), dtype=np.float32)
    # atmospheric sea gradient + subtle vignette-ish glow
    g = np.exp(-(((xx - cx) / 900) ** 2 + ((yy - cy) / 700) ** 2)).astype(np.float32)
    a += np.array([12, 30, 42], dtype=np.float32) * g[..., None]
    a += edge[..., None] * np.array([95, 180, 205], dtype=np.float32) * glow
    # land with vertical shading
    shade = (0.80 + 0.26 * (1 - yy / H))[..., None]
    a = a * (1 - mask[..., None]) + (mask[..., None] * np.array(land, dtype=np.float32) * shade)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def graticule(d, cx, cy, scale, alpha=26):
    for lon in range(118, 150):
        x, _ = proj(lon, 0, cx, cy, scale)
        if 0 < x < W:
            d.line([(x, 0), (x, H)], fill=(120, 175, 195, alpha if lon % 5 == 0 else alpha // 2))
    for lat in range(24, 50):
        _, y = proj(0, lat, cx, cy, scale)
        if 0 < y < H:
            d.line([(0, y), (W, y)], fill=(120, 175, 195, alpha if lat % 5 == 0 else alpha // 2))


def map_hud(d, t, kicker, title, sub, coords=None, alpha=255, size=44):
    label(d, 96, 108, kicker, AMBER, 13, 3.2, alpha=alpha)
    text(d, (96, 108 + 62), title, F_TITLE, size, BONE, tracking=1.6, alpha=alpha)
    text(d, (96, 108 + 62 + 40), sub, F_MONO, 13, BONE_DIM, tracking=3.0, alpha=alpha * 0.8)
    if coords:
        label(d, 96, 108 + 62 + 78, coords, STEEL, 12, 2.4, alpha=alpha * 0.75, tick=False)


def left_scrim(img, strength=0.55, width=980):
    a = np.asarray(img).astype(np.float32)
    x = np.arange(W, dtype=np.float32)[None, :]
    m = np.clip(1.0 - x / width, 0, 1)[0][None, :, None] ** 1.4 * strength
    a = a * (1 - m * 0.92)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def bottom_scrim(img, strength=0.6, start=620):
    a = np.asarray(img).astype(np.float32)
    y = np.arange(H, dtype=np.float32)[:, None]
    m = np.clip((y - start) / (H - start), 0, 1) ** 1.5 * strength
    a = a * (1 - m[..., None] * 0.92)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def soft_patch(img, cx, cy, rx, ry, strength=0.35):
    a = np.asarray(img).astype(np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    m = np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2)) * strength
    a = a * (1 - m[..., None] * 0.95)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def scrim_top(img, strength=0.5, end=420):
    a = np.asarray(img).astype(np.float32)
    y = np.arange(H, dtype=np.float32)[:, None]
    m = np.clip((end - y) / end, 0, 1) ** 1.4 * strength
    a = a * (1 - m[..., None] * 0.9)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def scale_bar(d, x, y, km, scale, alpha=255):
    px = km / 111.0 * scale
    d.line([(x, y), (x + px, y)], fill=BONE_DIM + (int(alpha * 0.7),), width=2)
    for xx in (x, x + px):
        d.line([(xx, y - 6), (xx, y + 6)], fill=BONE_DIM + (int(alpha * 0.7),), width=2)
    text(d, (x, y + 26), "%d KM" % km, F_MONO, 11, BONE_DIM, tracking=2.4, alpha=alpha * 0.7)


# ================================================================ 01 map
def shot01(t, dur):
    ov, d = layer()
    L1 = (0.0, 3.5)
    L2 = (3.5, 5.9)

    def ease_level(a, b, k=1.0):
        return ease_io(clamp((t - a) / (b - a)))

    # -------- level 1: Japan
    if t < L2[0]:
        p = ease_io(clamp(t / 3.2))
        cx, cy = 960, 520
        S = lerp(118, 152, p)
        coast = geo("50m")
        img = map_render(coast, cx, cy, S, t)
        img = left_scrim(img, 0.5, 1100)
        ov, d = layer()
        graticule(d, cx, cy, S, 22)
        a1 = 255 * rev(t, 0.35, 0.6) * (1 - rev(t, 3.5, 0.55))
        map_hud(d, t, "LOCATION  /  01", "JAPAN", "EAST ASIA  ·  NAGASAKI PREFECTURE", alpha=a1)
        nx, ny = proj(129.87, 32.75, cx, cy, S)
        k = rev(t, 2.1, 0.5) * (1 - rev(t, 3.5, 0.5))
        if k > 0:
            rings(d, nx, ny, t, 2.15, 1.8, 2, AMBER, 100, 2, 200 * k)
            pin(d, nx, ny, AMBER, 255 * k, 5)
            text(d, (nx + 18, ny + 6), "NAGASAKI", F_MONO_M, 14, BONE, tracking=3.2, alpha=235 * k)
        return comp(img, ov), ov

    # -------- level 2: Kyushu / Nagasaki coast
    p = ease_io(clamp((t - L2[0]) / (L2[1] - L2[0])))
    S = lerp(430, 780, p)
    lon0, lat0 = 129.95, 32.95
    cx, cy = W / 2, H / 2
    coast = geo("10m")
    img = map_render(coast, cx, cy, S, t, land=(66, 80, 88), glow=0.95)
    img = left_scrim(img, 0.5, 900)
    ov, d = layer()
    graticule(d, cx, cy, S, 20)
    a2 = 255 * rev(t, 3.6, 0.6)
    map_hud(d, t, "LOCATION  /  02", "NAGASAKI", "WESTERN KYUSHU  ·  EAST CHINA SEA", alpha=a2)
    scale_bar(d, 96, 950, 25, S, a2)

    # Nagasaki city
    nx, ny = proj(129.873, 32.750, cx, cy, S)
    pin(d, nx, ny, BONE, 240, 4.5)
    text(d, (nx + 16, ny + 5), "NAGASAKI CITY", F_MONO, 13, BONE, tracking=2.8, alpha=215)

    # Hashima marker (appears on cue)
    hx, hy = proj(129.7384, 32.6278, cx, cy, S)
    kh = rev(t, 4.9, 0.5)
    if kh > 0:
        rings(d, hx, hy, t, 4.95, 1.6, 3, AMBER, 130, 2, 220 * kh)
        pin(d, hx, hy, AMBER, 255 * kh, 6)
        # callout line + label
        lx, ly = hx + 90, hy + 120
        d.line([(hx + 8, hy + 8), (lx - 8, ly - 8)], fill=(232, 163, 61, int(210 * kh)), width=1)
        d.line([(lx - 8, ly - 8), (lx + 210, ly - 8)], fill=(232, 163, 61, int(210 * kh)), width=1)
        text(d, (lx + 4, ly - 20), "HASHIMA  ·  端島", F_MONO_M, 14, AMBER, tracking=3,
             alpha=240 * kh)
        text(d, (lx + 4, ly + 22), "32.6278° N   129.7384° E", F_MONO, 11, BONE_DIM,
             tracking=2, alpha=190 * kh)
    return comp(img, ov), ov


# ================================================================ 02 aerial push
def shot02(t, dur):
    pl = plate("aerial_island.jpg", width=2400, bloom_strength=0.42)
    p = ease_io(clamp(t / dur))
    frame = pl.crop(lerp(0.505, 0.452, p), lerp(0.52, 0.50, p), lerp(0.74, 0.32, p))
    ov, d = layer()
    k = rev(t, 0.25, 0.6)
    label(d, 96, 968, "HASHIMA  ·  PRESENT DAY", AMBER, 13, 3.0, alpha=215 * k)
    text(d, (1824, 968), "AERIAL  /  GOOGLE EARTH", F_MONO, 12, BONE_DIM, tracking=2.6,
         alpha=180 * k, anchor="rs")
    # subtle finder bracket
    kb = rev(t, 0.9, 0.5)
    corners(d, (700, 250, 1220, 830), 40, BONE, 90 * kb, 1)
    return comp(frame, ov), ov


# ================================================================ 03 silhouette slam
def shot03(t, dur):
    # ink background with a fine dot grid
    a = np.zeros((H, W, 3), dtype=np.float32) + np.array([9, 12, 16], dtype=np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    a[(xx % 48 == 0) & (yy % 48 == 0)] = np.array([32, 40, 48], dtype=np.float32)
    bg = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

    AR = 1080 / meta()["aspect"]
    pol = island_poly(960, 540, 1080, 19)
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon([tuple(p) for p in pol], fill=255)
    m = m.filter(ImageFilter.GaussianBlur(0.7))

    # building plan etched inside the silhouette
    plan = Image.new("L", (W, H), 0)
    pd = ImageDraw.Draw(plan)
    ang = math.radians(19)
    ca, sa = math.cos(ang), math.sin(ang)
    for b in blocks():
        px = [(c[0] - 0.5) * 1080 for c in b["c"]]
        py = [(c[1] - 0.5) * AR for c in b["c"]]
        rp = [(x * ca - y * sa + 960, x * sa + y * ca + 540) for x, y in zip(px, py)]
        pd.line(rp + [rp[0]], fill=int(110 + 90 * b["tone"]), width=2, joint="curve")
    plan = Image.fromarray((np.asarray(plan).astype(np.float32) * (np.asarray(m).astype(np.float32) / 255.0))
                           .astype(np.uint8))

    # wipe reveal from top, feathered band
    k = ease_out(clamp((t - 0.1) / 0.9), 3)
    cut = lerp(-40, H + 60, k)
    band = 46
    ya = np.arange(H, dtype=np.float32)
    wv = np.clip((cut - ya) / band, 0, 1)
    wmask = Image.fromarray((wv * 255).astype(np.uint8)[:, None].repeat(W, 1))
    mm = Image.composite(m, Image.new("L", (W, H), 0), wmask)
    ppm = Image.composite(plan, Image.new("L", (W, H), 0), wmask)

    shape = Image.new("RGB", (W, H), (243, 237, 225))
    shape.paste((52, 62, 70), (0, 0), ppm.point(lambda v: int(v * 0.55)))
    frame = Image.composite(shape, bg, mm)

    ov, d = layer()
    kk = rev(t, 0.7, 0.5)
    label(d, 96, 150, "SATELLITE SILHOUETTE", AMBER, 13, 3.0, alpha=225 * kk)
    text(d, (96, 208), "HASHIMA", F_TITLE, 46, BONE, tracking=2.4, alpha=240 * kk)
    text(d, (96, 236), "32.6278° N   129.7384° E", F_MONO, 12, BONE_DIM, tracking=2.2,
         alpha=170 * kk)
    label(d, 1810, 930, "TRACED FROM THE AERIAL", BONE_DIM, 12, 2.6, alpha=150 * kk, anchor="rs")
    return comp(frame, ov), ov


# ================================================================ 04 battleship
def shot04(t, dur):
    pl = plate("aerial_island_wide.jpg", width=2400, bloom_strength=0.38)
    p = ease_io(clamp(t / dur))
    bg = pl.crop(lerp(0.5, 0.46, p), lerp(0.5, 0.55, p), lerp(0.58, 0.50, p))
    bg = darken(bg, 0.34, (0.88, 0.98, 1.12))
    bg = Image.blend(bg, Image.new("RGB", (W, H), (6, 9, 13)), 0.34)
    frame = bg

    pol = island_poly(1120, 470, 660, 19)
    ang = math.radians(-19)
    ca, sa = math.cos(ang), math.sin(ang)
    x = pol[:, 0] - 1120
    y = pol[:, 1] - 470
    rpol = np.stack([x * ca - y * sa + 1120, x * sa + y * ca + 470], axis=1)

    ov, d = layer()
    # faint full outline for context
    d.line([tuple(v) for v in rpol] + [tuple(rpol[0])], fill=(236, 230, 218, 45), width=2)

    # bright tracer (stops at 88% for a nicer still)
    lp = ease_io(clamp((t - 0.15) / 2.1)) * 0.88
    seg = max(2, int(len(rpol) * lp))
    pts = [tuple(v) for v in rpol[:seg]]
    if len(pts) > 1:
        d.line(pts, fill=(246, 240, 228, 255), width=3, joint="curve")
    # leading dot only while the tracer is drawing
    if 2 < seg < len(rpol):
        dot(d, pts[-1][0], pts[-1][1], 5, AMBER, 240)

    dm = rev(t, 1.15, 0.6)
    y_dim = float(rpol[:, 1].max()) + 56
    x0, x1 = float(rpol[:, 0].min()), float(rpol[:, 0].max())
    xm0, xm1 = lerp((x0 + x1) / 2, x0, dm), lerp((x0 + x1) / 2, x1, dm)
    d.line([(xm0, y_dim), (xm1, y_dim)], fill=(232, 163, 61, 235), width=2)
    if dm > 0.55:
        for xx in (x0, x1):
            d.line([(xx, y_dim - 9), (xx, y_dim + 9)], fill=(232, 163, 61, 235), width=2)
    text(d, (1120, y_dim + 44), "LENGTH  ≈  480 M", F_MONO_M, 14, AMBER, tracking=3.2,
         alpha=235 * dm, anchor="ms")

    dm2 = rev(t, 1.45, 0.6)
    x_dim = float(rpol[:, 0].max()) + 52
    y0_, y1_ = float(rpol[:, 1].min()), float(rpol[:, 1].max())
    ym0, ym1 = lerp((y0_ + y1_) / 2, y0_, dm2), lerp((y0_ + y1_) / 2, y1_, dm2)
    d.line([(x_dim, ym0), (x_dim, ym1)], fill=(232, 163, 61, 200), width=2)
    text(d, (x_dim + 16, (y0_ + y1_) / 2 - 10), "WIDTH", F_MONO, 11, AMBER,
         tracking=2.6, alpha=210 * dm2, anchor="lm")
    text(d, (x_dim + 16, (y0_ + y1_) / 2 + 12), "≈ 160 M", F_MONO, 12, AMBER,
         tracking=2.6, alpha=215 * dm2, anchor="lm")

    ttl = rev(t, 0.3, 0.5)
    label(d, 96, 690, "WHY THEY NAMED IT", AMBER, 13, 3.0, alpha=220 * ttl)
    text(d, (96, 790), "IT LOOKS LIKE", F_TITLE, 82, BONE, tracking=1.2, alpha=242 * ttl)
    text(d, (96, 878), "A WARSHIP.", F_TITLE, 82, BONE, tracking=1.2, alpha=242 * ttl)

    jk = rev(t, 1.8, 0.7)
    text(d, (1824, 148), "軍艦島", F_JP, 38, AMBER, tracking=10, alpha=225 * jk, anchor="rs")
    text(d, (1824, 180), "GUNKANJIMA  /  BATTLESHIP ISLAND", F_MONO, 12, BONE_DIM,
         tracking=2.8, alpha=190 * jk, anchor="rs")
    frame = shake(frame, t, 0.03, 9.0)
    return comp(frame, ov), ov


# ================================================================ 05 approach
def shot05(t, dur):
    pl = plate("seawall_from_sea.jpg", width=2400, bloom_strength=0.48)
    p = ease_io(clamp(t / dur))
    frame = pl.crop(lerp(0.50, 0.57, p), lerp(0.53, 0.46, p), lerp(0.36, 0.27, p))
    frame = scrim(frame, strength=0.45, side="bottom")
    ov, d = layer()
    t1 = rev(t, 0.45, 0.5)
    label(d, 96, 902, "THE ISLAND ITSELF", AMBER, 13, 3.0, alpha=220 * t1)
    text(d, (96, 978), "SIX HECTARES OF CONCRETE.", F_TITLE, 62, BONE, tracking=1.8,
         alpha=243 * t1)
    t2 = rev(t, 1.25, 0.6)
    text(d, (98, 1024), "AND NOT ONE PERSON LEFT INSIDE.", F_UI, 21, BONE_DIM,
         tracking=3.6, alpha=215 * t2)
    return comp(frame, ov), ov


# ================================================================ 06 the void
def shot06(t, dur):
    pl = plate("ruins_courtyard.jpg", width=2600, bloom_strength=0.3)
    p = ease_io(clamp(t / dur))
    frame = pl.crop(lerp(0.50, 0.53, p), lerp(0.62, 0.40, p), lerp(0.46, 0.30, p))
    frame = darken(frame, 0.70, (0.88, 0.98, 1.12))
    a6 = np.asarray(frame).astype(np.float32)
    l6 = a6 @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    a6 = l6[..., None] * np.array([0.80, 0.90, 1.02]) + a6 * 0.28
    frame = Image.fromarray(np.clip(a6, 0, 255).astype(np.uint8))
    frame = Image.blend(Image.new("RGB", (W, H), (5, 8, 11)), frame, rev(t, 0.0, 0.55))
    ov, d = layer()
    box = (740, 240, 1180, 840)
    sc = rev(t, 0.5, 0.6)
    corners(d, box, 22, BONE, 180 * sc, 1)
    sy = lerp(box[1], box[3], (t / 2.8) % 1.0)
    d.line([(box[0], sy), (box[2], sy)], fill=(236, 230, 218, 26), width=1)
    label(d, box[0], box[3] + 42, "BUILDING 65  ·  SILENT", AMBER, 12, 2.6,
          alpha=205 * rev(t, 0.9, 0.5))
    return comp(frame, ov), ov


# ================================================================ 07 crowds
def halftone(im, dot=3.2):
    hw, hh = im.size[0] // 2, im.size[1] // 2
    im = im.resize((hw, hh), Image.BILINEAR)
    dot = dot / 2.0
    g = np.asarray(im.convert("L")).astype(np.float32) / 255.0
    h, w = g.shape
    yy, xx = np.mgrid[0:h, 0:w]
    pat = 0.5 + 0.5 * np.cos((xx + yy) / dot * math.pi) * np.cos((xx - yy) / dot * math.pi)
    v = np.clip((g - (1 - pat)) * 2.6 + 0.30, 0, 1)
    v = 0.34 + v * 0.66
    out = np.stack([v * 0.99, v * 0.965, v * 0.93], axis=2) * 255
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).resize((W, H), Image.BILINEAR)


def shot07(t, dur):
    pl = plate("archive_blocks.jpg", width=2600, bloom_strength=0.4)
    p = ease_io(clamp(t / dur))
    frame = pl.crop(lerp(0.46, 0.55, p), lerp(0.55, 0.40, p), lerp(0.78, 0.64, p))
    frame = halftone(frame, 3.0)
    frame = darken(frame, 0.95, (1.02, 1.0, 0.95))
    ov, d = layer()
    rng = random.Random(int(t * 10))
    for i in range(2):
        x = 160 + i * 70 + rng.uniform(-5, 5)
        d.line([(x, 0), (x + rng.uniform(-2, 2), H)], fill=(255, 255, 255, 10), width=1)
    text(d, (1824, 96), "ARCHIVE  ·  C. 1955", F_MONO_M, 12, BONE, tracking=3.0,
         alpha=175, anchor="rs")
    k = rev(t, 0.35, 0.5)
    frame = bottom_scrim(frame, 0.78, 620)
    label(d, 96, 806, "AT ITS PEAK  ·  1959", AMBER_HI, 14, 3.2, alpha=245 * k)
    text(d, (96, 830), "", F_MONO, 10)
    text(d, (92, 950), "5,259", F_TITLE, 140, BONE, tracking=4, alpha=250 * k)
    text(d, (98, 994), "PEOPLE ON SIX HECTARES", F_UI, 19, BONE_DIM, tracking=2.8, alpha=225 * k)
    text(d, (98, 1022), "THE DENSEST PLACE ON EARTH", F_MONO, 11, BONE, tracking=2.6,
         alpha=190 * rev(t, 1.1, 0.5))
    return comp(frame, ov), ov


# ================================================================ 08 the mine
def shot08(t, dur):
    pl = plate("ruins_interior.jpg", width=2600, bloom_strength=0.42)
    p = ease_io(clamp(t / dur))
    frame = pl.crop(lerp(0.40, 0.58, p), lerp(0.54, 0.47, p), lerp(0.46, 0.34, p))
    frame = darken(frame, 0.90, (1.02, 1.0, 0.94))
    ov, d = layer()
    k = rev(t, 0.3, 0.55)
    vline(d, 96, 700, 944, AMBER, 200 * k, 2)
    label(d, 132, 736, "1887 — 1974", AMBER, 13, 2.8, alpha=215 * k, tick=False)
    text(d, (132, 830), "COAL FROM", F_TITLE, 58, BONE, tracking=1.6, alpha=238 * k)
    text(d, (132, 898), "UNDER THE SEA.", F_TITLE, 58, BONE, tracking=1.6, alpha=238 * k)
    return comp(frame, ov), ov


# ================================================================ 09 evacuation
def shot09(t, dur):
    pl = plate("seawall_from_sea.jpg", width=2400, bloom_strength=0.20)
    frame = pl.crop(0.57, 0.42, 0.58)
    # aged, faded print: desaturate, lift, cool the shadows
    a = np.asarray(frame.convert("L")).astype(np.float32) / 255.0
    a = a ** 1.06
    tone = np.stack([a * 0.98 + 0.05, a * 0.98 + 0.055, a * 0.96 + 0.07], axis=2)
    frame = Image.fromarray(np.clip(tone * 255, 0, 255).astype(np.uint8))
    frame = darken(frame, 0.88, (1.0, 1.0, 1.04))
    frame = Image.blend(Image.new("RGB", (W, H), INK), frame, rev(t, 0.0, 0.55))
    frame = bottom_scrim(frame, 0.35, 700)
    frame = scrim_top(frame, 0.45)
    frame = left_scrim(frame, 0.62, 1150)
    frame = soft_patch(frame, 610, 500, 620, 420, 0.30)
    frame = soft_patch(frame, 600, 810, 420, 190, 0.34)

    ov, d = layer()
    s1 = rev(t, 0.2, 0.4)
    text(d, (620, 150), "JANUARY 1974", F_MONO_M, 14, AMBER, tracking=9, alpha=235 * s1, anchor="ms")
    text(d, (620, 180), "MITSUBISHI ANNOUNCES THE CLOSURE", F_UI, 14, BONE_DIM,
         tracking=3.6, alpha=205 * s1, anchor="ms")

    kk = ease_out(clamp((t - 0.55) / 1.5), 2)
    pop = int(round(5259 * (1 - kk)))
    text(d, (620, 452), f"{pop:,}", F_TITLE, 196, BONE, tracking=6, alpha=248, anchor="ms")
    text(d, (620, 512), "RESIDENTS REMAINING", F_UI, 15, BONE_DIM, tracking=7,
         alpha=210, anchor="ms")

    k2 = rev(t, 2.3, 0.7)
    vline(d, 620, 700, 700 + 40 * k2, AMBER, 165)
    text(d, (620, 800), "APRIL 1974", F_MONO_M, 15, AMBER, tracking=9, alpha=232 * k2, anchor="ms")
    text(d, (620, 832), "THE LAST BOAT LEAVES", F_MONO, 11, BONE_DIM, tracking=4.6,
         alpha=195 * k2, anchor="ms")
    # film edge ticks
    for yy in range(140, H - 80, 64):
        vline(d, 44, yy, yy + 16, BONE, 26)
        vline(d, W - 44, yy, yy + 16, BONE, 26)
    return comp(frame, ov), ov


# ================================================================ 10 silence
def shot10(t, dur):
    pl = plate("aerial_island_wide.jpg", width=2200, bloom_strength=0.35)
    p = ease_io(clamp(t / dur))
    frame = pl.crop(lerp(0.50, 0.45, p), lerp(0.50, 0.56, p), lerp(0.42, 0.33, p))
    frame = duotone(frame, (6, 12, 18), (176, 196, 204), 1.05)
    frame = darken(frame, 0.62)
    ov, d = layer()
    k = rev(t, 0.5, 1.0)
    vline(d, 960, 430, 430 + 70 * k, AMBER, 130)
    text(d, (960, 552), "THEN EVERYTHING WENT QUIET.", F_UI, 21, (218, 228, 232), tracking=8,
         alpha=228 * k, anchor="ms")
    return comp(frame, ov), ov


# ================================================================ 11 title
def shot11(t, dur):
    pl = plate("ruins_courtyard.jpg", width=2600, bloom_strength=0.4)
    p = ease_io(clamp(t / dur))
    frame = pl.crop(lerp(0.50, 0.51, p), lerp(0.64, 0.50, p), lerp(0.54, 0.44, p))
    frame = darken(frame, 0.46, (0.88, 0.97, 1.1))
    frame = Image.blend(frame, Image.new("RGB", (W, H), INK), 0.48)
    ov, d = layer()
    k = rev(t, 0.15, 0.9)
    text(d, (960, 442), "GUNKANJIMA", F_TITLE, 162, (242, 235, 222), tracking=8,
         alpha=248 * k, anchor="ms")
    text(d, (960, 548), "軍艦島", F_JP, 42, AMBER, tracking=24, alpha=235 * rev(t, 0.95, 0.7),
         anchor="mm")
    vline(d, 960, 626, 626 + 44 * rev(t, 1.25, 0.8), BONE, 130)
    text(d, (960, 736), "ABANDONED  ·  1974", F_UI, 17, BONE_DIM, tracking=9,
         alpha=215 * rev(t, 1.45, 0.7), anchor="ms")
    frame = shake(frame, t, 0.05, 8.0)
    return comp(frame, ov), ov


# ================================================================ 12 end card
def shot12(t, dur):
    a = np.zeros((H, W, 3), dtype=np.float32) + np.array([8, 10, 13], dtype=np.float32)
    yy, xx = np.mgrid[0:H, 0:W]
    a[(xx % 5 == 0)] *= 0.96
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    ov, d = layer()

    k = rev(t, 0.1, 0.7)
    label(d, 96, 110, "MADE WITH AI  ·  NO FOOTAGE SHOT", AMBER, 13, 3.2, alpha=200 * k)
    text(d, (92, 300), "ONE STORY.", F_TITLE, 104, BONE, tracking=3, alpha=250 * k)
    text(d, (92, 412), "NO CAMERA CREW.", F_TITLE, 104, AMBER, tracking=3,
         alpha=250 * rev(t, 0.35, 0.7))

    items = [("RESEARCH + SCRIPT", "written for this film"),
             ("VOICE", "AI narration"),
             ("VISUALS", "aerial stills + motion design"),
             ("MAP ANIMATION", "drawn from coastline data"),
             ("SOUND", "score + design synthesised"),
             ("EDIT", "scripted timeline, 1080p master")]
    cols = 3
    for i, (h1, h2) in enumerate(items):
        cx = 92 + (i % cols) * 576
        cy = 610 + (i // cols) * 118
        ka = rev(t, 1.0 + i * 0.09, 0.55)
        hline(d, cx, cx + 500, cy - 26, BONE, 40 * ka)
        text(d, (cx, cy), h1, F_MONO_M, 12, AMBER, tracking=2.8, alpha=215 * ka)
        text(d, (cx, cy + 30), h2, F_UI, 17, BONE_DIM, tracking=0.6, alpha=200 * ka)
    kb = rev(t, 2.0, 0.6)
    text(d, (92, 1000), "Reference: neo — “Why This Japanese Island is Abandoned” (structure study)",
         F_MONO, 11, (120, 128, 132), tracking=1.6, alpha=150 * kb)
    return comp(img, ov), ov


SHOTS = [
    (1, shot01, 8.6),
    (2, shot02, 6.0),
    (3, shot03, 4.0),
    (4, shot04, 9.0),
    (5, shot05, 6.6),
    (6, shot06, 5.4),
    (7, shot07, 9.0),
    (8, shot08, 6.4),
    (9, shot09, 7.6),
    (10, shot10, 5.6),
    (11, shot11, 6.2),
    (12, shot12, 5.8),
]


def timeline():
    out = []
    at = 0.0
    for idx, fn, dur in SHOTS:
        out.append((idx, fn, at, dur))
        at += dur
    return out, at
