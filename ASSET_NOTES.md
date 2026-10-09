# Image provenance

`public/images/ls-logo.webp` is the owner-supplied logo (`logo.png`, with the truck and the "Schnell | Zuverlässig | Sauber" tagline). It was only trimmed to its visible edges and resized to 520 px wide WebP for fast loading; the artwork itself is unchanged.

`public/images/cleared-room.webp` was generated with the built-in Imagegen tool and converted to WebP for efficient delivery. It is an illustrative scene, not a company project photograph. The website labels it accordingly.

`public/images/vorher.jpg` and `public/images/nachher.jpg` (before/after slider) come from two owner-supplied files, `moving1.jpg` and `moving2.png`:

- `moving1.jpg` is a bedroom full of moving boxes, credited "Roger Mommaerts / Flickr / CC" in its corner. The exact Creative Commons variant could not be verified because the Flickr account is no longer reachable. Confirm that it allows commercial use and modification (no NC or ND clause) before publishing, or replace the pair with the owner's own photos.
- `moving2.png` is an edited version of the same scene with the boxes removed.
- Processing: `moving2` was aligned onto `moving1` (SIFT feature matching and a homography, mean error about 1.3 px). Both were cropped to the same 16:9 area, which also removes the corner watermark, and exported at 1600 × 900. The after image's colours were matched to the before image. The website caption credits the photographer and states that the after view is edited.
- To swap in new photos, keep both files the same size and taken from the same spot.

`public/images/vorher-2.jpg` and `public/images/nachher-2.jpg` (second slider, portrait 3:4) come from the owner-supplied files `movebefore2.jpg` (480 × 640) and `moveafter2.png` (1086 × 1448, an edited version of the same scene):

- Source and licence of the original photo are unknown. Confirm them before publishing.
- Alignment: a homography (mean error about 1 px). `moveafter2` is effectively the same frame at 2.26× the size.
- The before photo only has 480 px of real detail, so the after photo was brought to the same detail level. This keeps sharpness equal on both sides of the divider.
- The after image's colours were matched to the before image.
- The TV screen was blurred in both images because the before photo showed personal streaming-profile names.
- Both images were cropped to the same 3:4 area. The crop removes warp edges and a stray object in the bottom-left corner. They were exported at 750 × 1000.

## Generation prompt

Use case: photorealistic-natural. Asset type: editorial hero photograph for a German clearance and furniture dismantling business website. Wide landscape 1536x1024. View through a broad doorway into a bright, freshly emptied European apartment with warm oak parquet, off-white plaster walls, high ceilings and generous windows at right. Foreground right: three tidy cardboard moving boxes with no text, a folded charcoal moving blanket on one box, and a small cordless drill. Left foreground: partial doorframe. A disassembled simple wooden shelving panel leans neatly against the far wall. Calm, credible architectural photography, natural late morning light casting precise geometric shadows, understated warm neutral palette, authentic lived-in material textures. Beautiful spacious composition, no people, no brands, no text, no watermark. Not a luxury showroom, not a construction ruin. This is an illustrative scene, not a documented company project.

## Licensed before-and-after photography

`public/images/office-cleanup-comparison.jpg` is the authentic matched home-office comparison “Before and After: Office Cleanup” by Mike McCune.

- Source: https://www.flickr.com/photos/mccun934/5156498714/
- Download: https://live.staticflickr.com/4068/5156498714_c2bc95df9a_b.jpg
- License: Creative Commons Attribution 2.0, https://creativecommons.org/licenses/by/2.0/
- Verification: the source page's license link points to CC BY 2.0. The author's description confirms clearing and reorganizing the same home office.
- Presentation: original collage displayed as two CSS-cropped halves; no image content regenerated or retouched. Public captions include author, source, original title, license, cropping notice, and a clear statement that this is not an L&S project.

## Current moving imagery

The office-cleanup collage is no longer used. The homepage now shows these two independently photographed moving-preparation scenes, with no before/after claims:

- `public/images/packed-moving-boxes.jpg`: Ketut Subiyanto, https://www.pexels.com/photo/empty-apartment-with-packed-carton-boxes-before-moving-4246119/
- `public/images/wrapped-living-room.jpg`: MART PRODUCTION, https://www.pexels.com/photo/furniture-covered-with-plastics-7415019/
- License: https://www.pexels.com/license/ (website and marketing use permitted). Both source pages mark the images free to use. Local copies are displayed with responsive CSS cropping and photographer credits. No pixel editing or AI generation was used for these photos.

## Owner-supplied photos (October 2026)

Supplied in the project folder and exported as WebP (quality 80), without retouching. The pairs are shown as drag-to-reveal sliders. The two photos in each pair were taken from slightly different positions, and automatic feature matching failed, so each pair was aligned by a measured offset against fixed reference points: the window (clearance), the room corner (bedroom) and the water heater (bathroom). The shared area was then cropped to the same size. Small differences remain where the camera angle changed.

| File | Source file | Used on |
|---|---|---|
| `clearance-before.webp` / `clearance-after.webp` (800 × 1200) | `Before_ Cluttered Room Restoration-2.png`, `Restored view of a cleared room-1.png` | Home page before/after slider |
| `bedroom-before.webp` / `bedroom-after.webp` (800 × 1067) | `Original bedroom before restoration-1.png`, `Sunlit empty room with parquet floors-2.png` | Home page before/after slider |
| `bathroom-before.webp` / `bathroom-after.webp` (800 × 1067) | `Teal-tiled bathroom before restoration-2.png`, `Exposed Bathroom After Demolition-3.png` | Home page before/after slider |

The origin of these files is not recorded. The site labels them only "Before" and "After" and does not call them L&S projects. If any of them are not genuine L&S jobs, add a note that they are example photos.

The service pages and their extra photos (bathtub removal; Pexels disposal and cleaning photos) were removed with those pages. The owner's original `Bathroom demolition with tub removal-1.png` is still in the project folder.
