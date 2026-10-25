# Image provenance

`public/images/ls-logo.webp` is the owner-supplied logo on a flat teal background (#00757F). The teal was removed by colour-to-alpha unmixing (no CSS tricks), keeping the white lettering, orange details and dark outlines. It was trimmed to its visible edges with 4 px of padding and exported as 897 × 570 WebP. Because the lettering is white, the logo must sit on teal or other dark surfaces.

`public/images/showcase/` holds six illustrative photos for the "Im Einsatz" gallery: `loading-van`, `stairwell`, `empty-room`, `dismantling`, `sorting` and `hallway` (WebP, quality 80, at the generated size of 1264 × 848, 848 × 1264 or 1024 × 1024). They were generated with Figma AI (`generate_image`, model gemini-3.1-flash-image) in the Figma file BpwhS8xqHLkMte8zwimTER, Page 1, nodes 87:2 and 88:2 to 92:2. The prompts asked for anonymous workers in plain teal workwear, faces turned away, and no text or logos; the licence plates in the van photo are blank. They do not show L&S staff, vehicles or jobs; replace them with real photos when available.

`public/images/hero-room/icon-menu.svg` is the menu glyph, a vector export from the Figma file (BpwhS8xqHLkMte8zwimTER, Assets section).

`public/hero-3d/` holds the hero's 3D scene assets. The furniture and household models, the surface textures (walls, masonry, parquet, concrete, plywood, tread plate) and the HDRI come from Poly Haven and are CC0 (public domain, `public/hero-3d/LICENSE.txt`). They are compressed copies built by `preview-3d/scripts/build-web-assets.mjs`: models as GLB, simplified to about a quarter of their vertices (within 1 % of their size), with meshopt-compressed geometry and WebP textures (512 px, 256 px for small props); surfaces as 512 px WebP; the HDRI at half size (512 × 256). The room, the removal van with its L&S livery, the moving boxes, the rolled rug and the art print are built in code (`components/hero-scene/`). The `fallback-*.webp` posters are renders of that scene. All of it is illustrative, not company photographs.

## Licensed photos ("Im Einsatz")

Two of the eight gallery tiles are Pexels photos, shown with responsive CSS cropping and no pixel editing or AI generation:

- `public/images/packed-moving-boxes.jpg` ("Sorgfältig verpackt"): Ketut Subiyanto, https://www.pexels.com/photo/empty-apartment-with-packed-carton-boxes-before-moving-4246119/
- `public/images/wrapped-living-room.jpg` ("Möbel geschützt"): MART PRODUCTION, https://www.pexels.com/photo/furniture-covered-with-plastics-7415019/
- License: https://www.pexels.com/license/ (website and marketing use permitted; credit not required).

Image sources are recorded here for maintenance. The public gallery and English legal notice do not display source notes or credits.

## Share image

`public/og-share.jpg` (1200 × 1200, the link preview once `SITE_URL` is set) is the whole `ls-logo.webp` at 80 % of the width, centred on flat brand teal (#00757F), composed with sharp. It is square so WhatsApp's square thumbnail shows the whole logo, and the logo is short enough to survive the 1.91:1 centre crop of Facebook and LinkedIn. It replaces `og-image.jpg` (the hero scene) and `og-logo.jpg`; each new name makes apps that cached the old preview fetch the new image.

The site icons are the whole logo on the brand teal too, composed with sharp: `app/icon.png` (512 × 512, rounded corners), `app/apple-icon.png` (180 × 180, square; iOS rounds it) and `app/favicon.ico` (16, 32 and 48 px). At tab size only the roof and "L&S" stay recognisable.

## Owner-supplied photos (October 2026)

Supplied in the project folder and exported as WebP (quality 80), without retouching. The pairs are shown as drag-to-reveal sliders. The two photos in each pair were taken from slightly different positions, and automatic feature matching failed, so each pair was aligned by a measured offset against fixed reference points: the window (clearance) and the water heater (bathroom). The shared area was then cropped to the same size. Small differences remain where the camera angle changed.

| File | Source file | Used on |
|---|---|---|
| `clearance-before.webp` / `clearance-after.webp` (800 × 1200) | `Before_ Cluttered Room Restoration-2.png`, `Restored view of a cleared room-1.png` | Home page before/after slider |
| `bathroom-before.webp` / `bathroom-after.webp` (800 × 1067) | `Teal-tiled bathroom before restoration-2.png`, `Exposed Bathroom After Demolition-3.png` | Home page before/after slider |

The origin of these files is not recorded. The site labels them only "Vorher" and "Nachher" and does not call them L&S projects. Before launch, the owner must confirm that L&S may publish them; if they are not genuine L&S jobs, label them as example photos on the page.

The service pages and their extra photos (bathtub removal; Pexels disposal and cleaning photos) were removed with those pages. The owner's original `Bathroom demolition with tub removal-1.png` is still in the project folder.

## Removed files

Unused images that were still deployed were deleted in October 2026: `cleared-room.webp`, `vorher.jpg` / `nachher.jpg` (a Flickr photo whose Creative Commons variant could not be verified, plus an edited copy), `vorher-2.jpg` / `nachher-2.jpg` (source and licence unknown) and `office-cleanup-comparison.jpg`. They remain in the git history.
