# L&S hero – local 3D scroll preview

An isolated three.js prototype of the house-clearance hero. It is not part of the live site or its build.

## Run

```bash
cd preview-3d
npm install
npm run fetch-assets
npm run serve
```

Then open http://localhost:4180. Scrolling drives the whole sequence; nothing moves on its own, and scrolling back plays it in reverse.

## Assets (all CC0)

`npm run fetch-assets` downloads them into `assets/`, which is not committed.

- **Worker:** "Worker" from poly.pizza (https://poly.pizza/m/Yg2bQZO6Hj), rigged, with walk and idle clips. Recoloured to teal and orange.
- **Removal van:** Kenney Car Kit `delivery.glb`, stretched to removal-van size. The palette is recoloured to white and orange; the rear roller door is animated.
- **Furniture, boxes, hand truck:** Poly Haven — Sofa_01, ArmChair_01, painted_wooden_cabinet_02, cardboard_box_01, hand_truck.
- **Surfaces:** Poly Haven PBR textures — roof tiles, parquet and asphalt; plaster, grass and concrete use only their relief (normal) maps.

## Scene

- **House:** two floors. The rooms are shown in section from the front. The hallway and stairs sit behind the front wall on the left, so walking between floors happens out of sight.
- **Van:** parked nose-first in the drive beside the house, with its rear and an aluminium ramp facing the street and the camera.

## What it does

- **Stages:**
  1. furnished house, crew waiting at the open van;
  2. three stacks of boxes go out on the hand truck, up the ramp and into the van; the hand truck stays in the van;
  3. two workers carry two cabinets, the sofa and the armchair. Cabinets are tipped over and carried lying down; everything is set into its own place in the cargo area;
  4. the empty house shows "Geräumt. Besenrein übergeben.";
  5. the ramp slides in, the roller door closes, and the crew walks to the cab on the far side;
  6. the van reverses out of the drive in a quarter turn, then drives off down the street. The wheels roll and the front wheels steer.
- **Motion:**
  - Feet follow the distance walked, so walking backwards plays the walk cycle backwards.
  - Arms reach the handles and items by two-bone IK.
  - The two carriers stay one item length apart, round corners and up the ramp, and the item tilts with the slope.
  - The hand truck leans back on its axle and tips the stack into place.
- **Desktop and mobile:** each has its own camera path ("wide" or "tall"), with the same timing.
- **Fallbacks:** reduced motion shows a before/after pair of stills rendered from the same scene, and there are fallback images if WebGL is missing.
- **Test hook:** `window.__preview` exposes `setTime(t)`, the timeline phases and a camera override for checking details.

## Known limits

- **Workers:** stylised low-poly figures, not photoreal; no CC0 photoreal rigged worker was found. Carrying uses IK on the walk clip because there are no dedicated carry or lift animations. Hands follow the items, but there is no finger or body lean.
- **Wardrobe:** there is no CC0 modern wardrobe, so a painted cabinet stands in for it.
- **Truck:** the Kenney truck is low-poly, and its cargo interior is a plain box.
- **Inside the van:** the front carrier walks in along a narrow aisle and can brush the furniture already loaded. The wheel arches aren't modelled as obstacles.
- **Cab:** the crew disappears at the cab door on the far side; there is no door animation.
