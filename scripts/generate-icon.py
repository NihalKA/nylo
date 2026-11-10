"""Regenerate every Nylo icon/splash asset from the owner's logo artwork.

Source: assets/brand/logo-source.png (owner-supplied, 11 Nov 2026). The wordmark
below the mark is excluded from icons; only the infinity-bubble mark is used.
Requires Pillow + numpy (asset editing only). Run: python3 scripts/generate-icon.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
src = Image.open(root / "assets/brand/logo-source.png").convert("RGB")
BG = (5, 8, 22)  # #05081A, the logo's background
CX, CY, MW = 685, 489, 775  # mark centre and width in the 1357px source

# Mark + glow only (above the wordmark), bottom edge faded into the background.
region = src.crop((0, 0, src.width, 800)).convert("RGBA")
fade = Image.new("L", region.size, 255)
draw = ImageDraw.Draw(fade)
for y in range(740, 800):
    draw.line([(0, y), (region.width, y)], fill=int(255 * (800 - y) / 60))
region.putalpha(fade)


def tile(size: int, mark_fraction: float) -> Image.Image:
    """Square on the logo background with the mark at `mark_fraction` width."""
    side = int(round(size * MW / (mark_fraction * size)))
    canvas = Image.new("RGBA", (side, side), BG + (255,))
    canvas.alpha_composite(region, (side // 2 - CX, side // 2 - CY))
    return canvas.convert("RGB").resize((size, size), Image.Resampling.LANCZOS)


assets = root / "assets"
tile(1024, 0.70).save(assets / "icon.png")
adaptive = tile(1024, 0.50)  # inside Android's 66% safe zone for any mask
adaptive.save(assets / "adaptive-icon.png")
adaptive.save(assets / "android-icon-foreground.png")
tile(1024, 0.42).save(assets / "splash-icon.png")
tile(64, 0.82).save(assets / "favicon.png")

res = root / "android/app/src/main/res"
for density, k in [("mdpi", 1), ("hdpi", 1.5), ("xhdpi", 2), ("xxhdpi", 3), ("xxxhdpi", 4)]:
    n, fg, splash = int(48 * k), int(108 * k), int(288 * k)
    tile(n, 0.70).save(res / f"mipmap-{density}/ic_launcher.webp", quality=95)
    rnd = tile(n, 0.62).convert("RGBA")
    mask = Image.new("L", (n * 4, n * 4), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, n * 4 - 1, n * 4 - 1), fill=255)
    rnd.putalpha(mask.resize((n, n), Image.Resampling.LANCZOS))
    rnd.save(res / f"mipmap-{density}/ic_launcher_round.webp", quality=95)
    tile(fg, 0.50).save(res / f"mipmap-{density}/ic_launcher_foreground.webp", quality=95)
    tile(splash, 0.62).save(res / f"drawable-{density}/splashscreen_logo.png")

# In-app transparent mark and tintable wordmark (white glyphs on alpha).
im = np.array(src).astype(float)
diff = (im - np.array(BG, float)).max(2)


def cutout(box, lo, span, white=False):
    x0, y0, x1, y1 = box
    a = np.clip((diff[y0:y1, x0:x1] - lo) / span, 0, 1)
    if white:
        rgb = np.full(a.shape + (3,), 255.0)
    else:
        A = a[..., None]
        rgb = np.clip(
            np.where(A > 0.01, (im[y0:y1, x0:x1] - np.array(BG) * (1 - A)) / np.maximum(A, 1e-3), 0),
            0,
            255,
        )
    out = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), "RGBA")
    return out.crop(out.getbbox())


mark = cutout((290, 225, 1085, 752), 70, 90)
mark.resize((480, round(480 * mark.height / mark.width)), Image.Resampling.LANCZOS).save(
    assets / "brand/mark.png", optimize=True
)
word = cutout((310, 800, 1075, 1140), 60, 150, white=True)
word.resize((360, round(360 * word.height / word.width)), Image.Resampling.LANCZOS).save(
    assets / "brand/wordmark.png", optimize=True
)
print("Icons, splash, favicon, Android mipmaps and in-app brand images regenerated.")
