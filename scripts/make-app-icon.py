from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

root = Path(__file__).resolve().parent.parent
size = 1024
image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sd.rounded_rectangle((96, 100, 928, 932), radius=190, fill=(23, 67, 48, 90))
image.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(38)))

draw = ImageDraw.Draw(image)
draw.rounded_rectangle((84, 72, 940, 928), radius=196, fill=(38, 127, 84, 255))
draw.rounded_rectangle((114, 102, 910, 898), radius=171, fill=(56, 151, 101, 255))

sparkle = [(510, 222), (572, 430), (776, 500), (572, 570),
           (510, 778), (448, 570), (244, 500), (448, 430)]
draw.polygon(sparkle, fill=(246, 254, 247, 255))
draw.ellipse((727, 261, 792, 326), fill=(219, 246, 226, 255))

desktop = root / 'desktop'
desktop.mkdir(exist_ok=True)
image.save(desktop / 'icon.png')
image.save(desktop / 'icon.icns')
