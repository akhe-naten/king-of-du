Put custom item PNG artwork here.

Current safe rollout:
- Encyclopedia cards, item popovers, and the personal storage detail panel read the optional `image` field.
- Auction, settlement, storage, and popover item rendering still use the stable mark/color blocks.
- Items without a custom image use `placeholder.png` in these preview-only positions.

Config usage:
- Copy a `.png` file into `custom/`.
- Set an item in `config/loot-config.json` to a browser-relative path, for example:
  `"image": "assets/item-textures/custom/old-book.png"`
- If the image path is not configured, preview-only positions use a ratio placeholder. If an image fails to load, the item's mark remains visible.

Ratio placeholders:
- `placeholder.png` and `placeholders/1x1.png` through `placeholders/5x5.png` are small pure-color PNGs.
- The personal storage grid picks the placeholder that matches the item's `w`/`h` footprint.
- Replace these files later if you want nicer default art for long or tall items.
