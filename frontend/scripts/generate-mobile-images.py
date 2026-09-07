import os
from PIL import Image

TARGETS = [
    ('hero.avif', 'hero-mobile.avif', (768, 768)),
    ('how-it-works.avif', 'how-it-works-mobile.avif', (640, 640)),
    ('context-social.avif', 'context-social-mobile.avif', (400, 400)),
    ('context-friends.avif', 'context-friends-mobile.avif', (400, 400)),
    ('context-firstimpression.avif', 'context-firstimpression-mobile.avif', (400, 400)),
    ('example-result.avif', 'example-result-mobile.avif', (640, 640)),
    ('codes.avif', 'codes-mobile.avif', (640, 640)),
    ('security.avif', 'security-mobile.avif', (640, 640)),
    ('final-cta.avif', 'final-cta-mobile.avif', (768, 768)),
]

dir_path = 'src/images/landing'

for src_name, dst_name, max_dims in TARGETS:
    src_file = os.path.join(dir_path, src_name)
    dst_file = os.path.join(dir_path, dst_name)
    img = Image.open(src_file)
    orig_w, orig_h = img.size
    img.thumbnail(max_dims, Image.Resampling.LANCZOS)
    img.save(dst_file, 'AVIF', quality=82)
    new_w, new_h = img.size
    orig_kb = os.path.getsize(src_file) / 1024
    new_kb = os.path.getsize(dst_file) / 1024
    print(f"Generated {dst_name:28}: {orig_w}x{orig_h} ({orig_kb:.1f}KB) -> {new_w}x{new_h} ({new_kb:.1f}KB)")
