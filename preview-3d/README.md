# L&S hero – local 3D scroll preview

An isolated three.js prototype of the house-clearance hero. It is not part of the live site or its build.

## Run

```bash
cd preview-3d
npm install
npm run fetch-assets
npm run serve
```

Then open http://localhost:4180. Scrolling drives the whole sequence: about two and a half screen heights on desktop, and slightly less on phones. Nothing moves on its own, and scrolling back plays it in reverse.

## Assets (all CC0, from Poly Haven)

`npm run fetch-assets` downloads them into `assets/` (about 180 MB, not committed):

- **Contents:** about 25 furniture and household models, including the sofa, armchairs, tables, chairs, cabinets, shelves, bed, TVs, plants, vases, pictures and baskets. The moving boxes and book rows are made in code, which keeps them light.
- **Garden and street props:** street lamps, a covered car, a garden set and planters.
- **Surfaces:** PBR textures for the lawn, asphalt, paving, granite kerbs, render, roof tiles, parquet and plywood.
- **Lighting:** an HDRI (kloofendal_48d_partly_cloudy_puresky) for ambient light and reflections.

The removal truck, the house and the street are built in code (`src/truck.js`, `src/world.js`).

## The scene

- **House:** a two-storey detached house shown in section from the front. It has four furnished rooms, a staircase, windows with sills, skirting boards, ceiling lamps, a side entrance, gutters, downpipes and a chimney.
- **Front garden:** stacks of packed moving boxes, some of them open and full of books, dishes and ornaments.
- **Street:** neighbouring houses, a driveway, pavement with granite kerbs, the street, lamp posts and a parked covered car.
- **Truck:** a 12-tonne removal truck in L&S livery, parked nose-first in the drive. It has a roller shutter, a tail lift, a lit cargo area with lashing rails, dual rear wheels and steered front wheels.

## The sequence

1. **Furnished house:** the truck waits with its shutter open and the tail lift down.
2. **Loading:** 72 pieces lift off and glide into the truck by themselves. Each one has its own place, worked out the way movers load:
   - large pieces first, lengthwise along the walls from the front;
   - boxes and small things stacked on flat tops;
   - anything standing on furniture at home leaves before the piece under it.
3. **Cleared:** the empty house shows "Geräumt. Besenrein übergeben."
4. **Closing up:** the roller shutter comes down and the tail lift folds up.
5. **Departure:** the truck reverses out of the drive in a quarter turn and drives off down the street, with the wheels rolling and the front wheels steering.

## Rendering

- **Lighting:** ACES tone mapping, a sun with soft shadows, HDRI image-based lighting turned to match the sun, and a sky dome with procedural clouds.
- **Merged geometry:** static parts of the house, street and truck are merged per material, about 340 draw calls in all.
- **Quality levels:** at load the page times one frame and picks a level:
  - **high:** ground-truth ambient occlusion (GTAO), 4× MSAA and 4K shadows;
  - **medium:** 2K shadows;
  - **low:** 1K shadows at pixel ratio 1.

  Add `?quality=high|medium|low` to force one. On an Intel integrated GPU it picks medium, at about 25–30 ms a frame.
- **Phones:** smaller textures, and never the high level.
- **Framing:** separate camera paths for desktop and phones (`wide` / `tall`).
- **Fallbacks:** reduced motion shows a before/after pair of stills rendered from the scene, and there are poster images if WebGL is missing.
- **Test hook:** `window.__preview` exposes `setTime(t)` (0–1), the packing plan and a camera override.

## Known limits

- **Truck:** procedural, so it's clean but simpler than a scanned vehicle. There is no realistic CC0 truck model.
- **Wardrobe:** there's no CC0 modern wardrobe, so cabinets and shelving stand in.
- **Trees:** the CC0 trees available are millions of triangles each, so the gardens have none.
- **Flights:** the pieces fly in smoothly but don't avoid each other. Inside the truck, a piece can briefly pass through one placed just before it.
