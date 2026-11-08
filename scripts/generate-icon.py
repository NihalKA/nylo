"""Render Nylo's original monoline n + memory dot. Requires Pillow for asset editing only."""
from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
scale = 4
image = Image.new('RGB', (1024 * scale, 1024 * scale), '#087F68')
draw = ImageDraw.Draw(image)
def box(values): return tuple(round(v * scale) for v in values)
ink = '#FFFFFF'
draw.arc(box((290, 275, 730, 715)), 180, 360, fill=ink, width=80*scale)
draw.line(box((330, 690, 330, 365)), fill=ink, width=80*scale)
draw.line(box((690, 495, 690, 690)), fill=ink, width=80*scale)
for x,y,r in [(330,365,40),(330,690,40),(690,690,40),(724,295,34)]:
 draw.ellipse(box((x-r,y-r,x+r,y+r)), fill=ink)
image = image.resize((1024,1024), Image.Resampling.LANCZOS)
for name in ['icon.png','adaptive-icon.png','android-icon-foreground.png','splash-icon.png']:
 image.save(root/'assets'/name)
image.resize((64,64),Image.Resampling.LANCZOS).save(root/'assets'/'favicon.png')
