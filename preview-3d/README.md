# L&S hero – local 3D scroll preview

An isolated three.js prototype of the house-clearance hero. It is not part of the live site or its build.

## Run

```bash
cd preview-3d
npm install
npm run fetch-assets
npm run serve
```

Then open http://localhost:4180. Scrolling drives the whole sequence; nothing moves on its own.

## Assets (all CC0)

`npm run fetch-assets` downloads them into `assets/`, which is not committed.

- **Worker:** "Worker" from poly.pizza (https://poly.pizza/m/Yg2bQZO6Hj), rigged, with walk and idle clips. Recoloured to teal and orange.
- **Delivery truck:** Kenney Car Kit `delivery.glb`. The palette is recoloured to white and orange; the rear door is hinged.
- **Furniture, boxes, hand truck:** Poly Haven — Sofa_01, ArmChair_01, painted_wooden_cabinet_02, cardboard_box_01, hand_truck.
- **Surfaces:** Poly Haven PBR textures — plaster, parquet, roof tiles, asphalt, grass, concrete.

## What it does

- **Stages:**
  1. furnished house;
  2. boxes leave on the trolley;
  3. two workers carry the sofa, cabinets and chair;
  4. the empty house shows "Geräumt. Besenrein übergeben.";
  5. the van door closes;
  6. the van drives off with its wheels turning.
- **Motion:** feet follow the distance walked, and arms reach the item by IK. The two carriers stay a fixed item length apart, and items are parked inside the van.
- **Desktop and mobile:** each has its own camera framing ("wide" or "tall").
- **Fallbacks:** reduced motion shows a still before/after pair rendered from the same scene, and there are fallback images if WebGL is missing.

## Known limits

- **Workers:** stylised low-poly figures, not photoreal; no CC0 photoreal rigged worker was found. Carrying uses IK on the walk clip because there are no dedicated carry animations.
- **Wardrobe:** there is no CC0 modern wardrobe, so a painted cabinet stands in for it.
- **Truck:** the Kenney delivery truck is low-poly.
- **Not yet checked:** the camera, material and furniture updates of the last pass have not been checked visually across every stage.
