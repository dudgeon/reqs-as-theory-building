#!/usr/bin/env python3
"""Generate the subtle paper texture used behind every frame (video/assets/paper.jpg)."""
import pathlib

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

W, H = 1920, 1080
rng = np.random.default_rng(7)
base = np.array([243, 237, 226], dtype=np.float32)            # #F3EDE2
blotch = gaussian_filter(rng.standard_normal((H, W)), 60) * 55  # soft, large-scale mottling
fibre = gaussian_filter(rng.standard_normal((H, W)), [0.6, 4]) * 3.0  # faint horizontal fibres
grain = rng.standard_normal((H, W)) * 2.2
lum = blotch + fibre + grain
img = base[None, None, :] + lum[..., None] * np.array([1.0, 0.97, 0.9])[None, None, :]
out = pathlib.Path(__file__).resolve().parent.parent / "video" / "assets" / "paper.jpg"
out.parent.mkdir(parents=True, exist_ok=True)
Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(out, quality=88)
print(out, out.stat().st_size // 1024, "KB")
