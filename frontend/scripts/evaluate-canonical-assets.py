import os
from PIL import Image

IMAGES = [
    ('hero.avif', 564, 705, 290, 363),
    ('how-it-works.avif', 454, 341, 334, 251),
    ('context-social.avif', 349, 436, 121, 151),
    ('context-friends.avif', 349, 436, 121, 151),
    ('context-firstimpression.avif', 349, 436, 121, 151),
    ('example-result.avif', 540, 432, 318, 254),
    ('codes.avif', 536, 536, 278, 278),
    ('security.avif', 536, 429, 278, 222),
    ('final-cta.avif', 611, 344, 318, 199),
]

dir_path = 'src/images/landing'

print(f"{'Image':<28} {'Orig Dim':<12} {'Orig KB':<8} {'Max Desk':<10} {'Mob':<10} {'Target 1.5-2x':<14}")
print("-" * 86)
for name, dw, dh, mw, mh in IMAGES:
    p = os.path.join(dir_path, name)
    img = Image.open(p)
    w, h = img.size
    kb = os.path.getsize(p) / 1024
    target_min = int(max(dw, dh) * 1.5)
    target_max = int(max(dw, dh) * 2.0)
    print(f"{name:<28} {f'{w}x{h}':<12} {f'{kb:.1f}':<8} {f'{dw}x{dh}':<10} {f'{mw}x{mh}':<10} {f'{target_min}-{target_max}px':<14}")
