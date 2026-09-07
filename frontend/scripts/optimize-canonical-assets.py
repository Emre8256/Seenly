import os
import shutil
from PIL import Image

dir_path = 'src/images/landing'
backup_dir = 'src/images/landing/originals_backup'

# Ensure backup of true originals exists
if not os.path.exists(backup_dir):
    os.makedirs(backup_dir)
    for f in os.listdir(dir_path):
        if f.endswith('.avif') and not f.endswith('-mobile.avif'):
            shutil.copy2(os.path.join(dir_path, f), os.path.join(backup_dir, f))

# Canonical plan:
# 1. hero: Keep responsive picture because desktop (564x705) needs 1400px for 2x retina, while mobile (290x363) benefits from 768px for fast LCP.
# 2. All other 8 images: Replace with single canonical assets providing 1.6x-2.0x desktop pixel density, eliminating all -mobile.avif duplicates!

CANONICAL_TARGETS = [
    # (source_in_backup, target_filename, max_dim, quality, is_canonical_single)
    ('how-it-works.avif', 'how-it-works.avif', 800, 82, True),
    ('context-social.avif', 'context-social.avif', 680, 82, True),
    ('context-friends.avif', 'context-friends.avif', 680, 82, True),
    ('context-firstimpression.avif', 'context-firstimpression.avif', 680, 82, True),
    ('example-result.avif', 'example-result.avif', 952, 85, True),
    ('codes.avif', 'codes.avif', 880, 82, True),
    ('security.avif', 'security.avif', 880, 82, True),
    ('final-cta.avif', 'final-cta.avif', 1000, 82, True),
    # hero: optimized desktop (1350px) and mobile (768px)
    ('hero.avif', 'hero.avif', 1350, 82, False),
    ('hero.avif', 'hero-mobile.avif', 768, 82, False),
]

for src_name, dst_name, max_dim, quality, is_canonical in CANONICAL_TARGETS:
    src_file = os.path.join(backup_dir, src_name)
    dst_file = os.path.join(dir_path, dst_name)
    img = Image.open(src_file)
    w, h = img.size
    
    # Resize keeping aspect ratio
    img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
    img.save(dst_file, 'AVIF', quality=quality)
    new_w, new_h = img.size
    new_kb = os.path.getsize(dst_file) / 1024
    print(f"Processed {dst_name:30}: {new_w}x{new_h} ({new_kb:.1f} KB) - Single canonical: {is_canonical}")

# Remove obsolete mobile duplicates that are now single canonical assets
OBSOLETE_MOBILE_DUPLICATES = [
    'how-it-works-mobile.avif',
    'context-social-mobile.avif',
    'context-friends-mobile.avif',
    'context-firstimpression-mobile.avif',
    'example-result-mobile.avif',
    'codes-mobile.avif',
    'security-mobile.avif',
    'final-cta-mobile.avif',
]

for f in OBSOLETE_MOBILE_DUPLICATES:
    p = os.path.join(dir_path, f)
    if os.path.exists(p):
        os.remove(p)
        print(f"Removed duplicate mobile file: {f}")
