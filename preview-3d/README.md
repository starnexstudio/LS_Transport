# L&S hero – local 3D scroll preview

The three.js prototype of the clearance hero. The website's hero runs a port of it (`components/hero-scene/`); this folder stays a standalone preview and holds the asset pipeline.

## Run

```bash
cd preview-3d
npm install
npm run fetch-assets
npm run serve
```

`npm run build-web-assets` then writes the compact copy the website loads to `public/hero-3d/` (models simplified to about a quarter and meshopt-compressed as GLB with WebP textures, surfaces as WebP, the HDRI at half size; about 3.6 MB).

Then open http://localhost:4180. Scrolling drives the whole sequence: about two and a half screen heights on desktop, and slightly less on tablets and phones. The header is part of the pinned stage, so the clearance starts on the first pixel of scroll. Nothing moves on its own, and scrolling back plays it in reverse.

## Layout

The header, label, headline and buttons match the website's (`components/hero.tsx`, `app/hero.css`). Around them the 3D scene takes the middle:

- **Large screens (1100 px wide and 640 px tall or more):** the label and the headline are centred at the top. The room (left) and the van (right) fill the middle, as large as the space allows (up to 1200 px wide). The site's four services stand in the corners, the room's on the left (Entrümpelung, Demontage) and the van's on the right (Möbeltransport & Lieferung, Fachgerechte Entsorgung). "Unverbindlich anfragen" and "Jetzt anrufen" sit centred under the scene, with "Schnell, zuverlässig und stressfrei." below.
- **Tablets and phones:** label, headline and the sentence "Wir übernehmen die komplette Räumung …" centred above the scene, the buttons centred below it (stacked on phones).
- **Scene:** the canvas covers the whole stage, but the camera frames the room and the van inside the band between the copy and the buttons, so nothing is cut off at its edges.
- **On the timeline:** "Neues." is underlined in orange once the room is empty, and the rail on the right fills with the scroll. Where the sentence shows, it lights up word by word while the room empties.

## Assets (all CC0, from Poly Haven)

`npm run fetch-assets` downloads them into `assets/` (not committed):

- **Contents:** about 25 furniture and household models, including the sofa, armchairs, coffee and dining tables, chairs, sideboard, cabinets, shelves, TV, plant, vases, pictures, suitcases and a basket. The moving boxes, the rolled rug and the book rows are made in code, which keeps them light.
- **Surfaces:** PBR textures for the walls and their masonry, the parquet floor and its concrete slab, the van's plywood lining and the tail lift's tread plate.
- **Lighting:** an HDRI (kloofendal_48d_partly_cloudy_puresky) for ambient light and reflections.

The removal van and the room are built in code (`src/truck.js`, `src/world.js`).

## The scene

The scene stands on the page's teal like a model on a table, seen from above and in front. The canvas is transparent, and there's no sky, street or building around it. The floor is invisible and only catches shadows, tinted dark teal, with soft contact shadows under the room and the van.

- **Room:** one living room cut open like an architect's model, front and right side removed. The cut shows how it is built: walls of plaster, masonry and render; a floor of concrete slab, screed and parquet. There's a white PVC tilt-and-turn window with its board and outside sill, a panel radiator under it with valve and pipes, a curtain on a rod, an interior door with frame, architraves, hinges and a steel lever handle, skirting boards, a light switch and sockets.
- **Contents:** packed full for the move. Furniture along the walls and in the middle (bookshelf, sideboard with the TV, steel shelving, commode, sofa, armchairs, coffee table, dining table and chairs), pictures still on the walls, a rug rolled up and taped, suitcases, and 22 moving boxes in stacks. The boxes are taped, have hand holes and printed arrows, and the room they belong to is written on the side in marker ("Küche", "Bücher", "Bad" and so on), with a "Vorsicht Glas" sticker on the fragile ones; some are open and full of books, dishes and ornaments.
- **Moving out:** where the pictures hung, a brighter patch of paint and the nail stay behind on the wall.
- **Van:** a 12-tonne removal truck in L&S livery with two rear swing doors (locking bars, hinges, seals, red contour marking) that fold back 270° along the sides when open, a tail lift, a lit cargo area with lashing rails, dual rear wheels and steered front wheels.
- **Layout:** on laptops and tablets the room stands on the left and the van on the right, its rear and tail lift turned to the room's open side, so both are whole in the frame side by side. On phones (up to 760 px wide, chosen at load) the van stands behind and to the right of the room with its rear towards the camera, which keeps the pair narrow enough to show large on a phone and looks straight into the van as it fills.

## The sequence

1. **Packed room:** the van waits with its doors open and the tail lift down.
2. **Loading:** 55 pieces lift off, glide out through the room's open side and into the van by themselves. Each one has its own place, worked out the way movers load:
   - large pieces first, lengthwise along the walls from the front;
   - boxes and small things stacked on flat tops;
   - anything standing on furniture leaves before the piece under it.
3. **Cleared:** the room is empty, and "Neues." in the headline is underlined.
4. **Closing up:** the rear doors swing shut, right then left, and the tail lift rises and folds up against them.
5. **Departure:** the van pulls away and turns right out of the frame (a gentle bend on laptops, a quarter turn on phones), with the wheels rolling and the front wheels steering, while the camera settles on the empty room.

## Rendering

- **Lighting:** ACES tone mapping, a sun with soft shadows, and HDRI image-based lighting turned to match the sun.
- **Ambient occlusion:** GTAO (three.js `GTAOPass`) shades the corners, the floor round and under the furniture, and the window and door reveals. The scene renders into a multisampled target first; the output pass undoes the premultiplied alpha before tone mapping, so the glass and the shadows on the transparent canvas keep their colour.
- **Merged geometry:** static parts of the room and the van are merged per material.
- **Lighter models:** dense Poly Haven models are thinned at load with meshoptimizer (UV seams kept), about 370k triangles in all.
- **Shadows:** PCF with a wide kernel instead of PCFSoft: soft edges at about half the cost. Below the top level, the shadow map is redrawn every other frame while things move, and always once they settle.
- **Quality levels:** at load the page times one frame and picks a level:
  - **high:** 4K shadows, updated every frame, ambient occlusion at full resolution;
  - **medium:** 2K shadows, ambient occlusion at half resolution;
  - **low:** 1K shadows, no ambient occlusion.

  Add `?quality=high|medium|low` to force one.
- **Dynamic resolution:** while scrolling, the render scale follows the frame rate (aiming for 60 fps), and a full-resolution frame is drawn once the motion stops. On an Intel integrated GPU it holds 60 fps.
- **Smooth motion:**
  - **Scroll:** the scene follows the scroll on a critically damped spring, so each wheel step or swipe becomes one glide.
  - **Camera:** a slow, continuous dolly like a filmed shot, on a spline that never stops between keys.
  - **Flights:** each piece follows one smooth curve with a sine ease, through the middle of the truck's rear opening.
- **Phones:** smaller textures, and never the high level.
- **Framing:** one camera path per layout, composed for a band of its own shape (2.4 times as wide as it is tall on laptops, 1.38 on phones). On any other band, laptops back the camera off along its line of sight until the same view fits; phones keep the viewpoint and widen the lens, so every phone shows the same picture (the room and van centred, about 6 % of the width to spare either side), only cropped taller or shorter.
- **Fallbacks:** reduced motion shows a before/after pair of stills rendered from the scene where the scene would be. The posters (`static/fallback-*.webp`, transparent, a `-m` pair for the phone layout, 1104 × 800 like the phone view) stand in while the scene loads and when WebGL is missing. On the site, `fallback-poster.webp` (1920 × 800, the laptop view's 2.4 : 1) and `fallback-poster-m.webp` (phones) stand in while the scene loads: the first frame drawn as most devices draw it (the site's medium level, without ambient occlusion), so fitted into the band it lines up with the live scene.
- **Test hook:** `window.__preview` exposes `setTime(t)` (0–1), `shoot(t, w, h)` for transparent stills, the packing plan and a camera override.

## Known limits

- **Truck:** procedural, so it's clean but simpler than a scanned vehicle. There is no realistic CC0 truck model.
- **Wardrobe:** there's no CC0 modern wardrobe, so cabinets and shelving stand in.
- **Flights:** the pieces fly in smoothly but don't avoid each other. Inside the truck, a piece can briefly pass through one placed just before it.
