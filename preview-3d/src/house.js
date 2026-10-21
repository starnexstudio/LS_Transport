// House, ground and driveway, built from simple architectural volumes with
// Poly Haven CC0 photo textures. Units are metres; +x right, +z towards camera.
import * as THREE from "three";
import { texture } from "./assets.js";

// Layout shared with the sequence.
export const H = {
  x0: -9, x1: -2, z0: -5, z1: 1,      // footprint; the rooms' front wall is cut away
  floor0: 0.3, floor1: 3.1, slab: 0.25, eaves: 5.6, ridge: 7.4, wall: 0.25,
  partitionX: -6.5,                     // hidden hallway (front door + stairs) left of it
  innerDoor: [-0.3, 0.7],               // z range of the doorway in the partition
  frontDoor: [-7.6, -6.6],              // x range of the front door
};

// Box whose UVs follow world size, so textures keep a constant scale.
function block(w, h, d, mats, tile = 1) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v; uv.setXY(i, uv.getX(i) * faces[f][0] / tile, uv.getY(i) * faces[f][1] / tile);
  }
  const m = new THREE.Mesh(g, mats);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const at = (mesh, x, y, z) => { mesh.position.set(x, y, z); return mesh; };

// Wall along x (constant z) or along z (constant x) with rectangular openings.
function wall(group, mat, { along, fixed, from, to, y0, y1, t, openings = [] }) {
  const cuts = [...openings].sort((a, b) => a.a - b.a);
  const add = (a, b, ya, yb) => {
    if (b - a < 0.01 || yb - ya < 0.01) return;
    const len = b - a, h = yb - ya, mid = (a + b) / 2, ym = (ya + yb) / 2;
    const mesh = along === "x" ? block(len, h, t, mat) : block(t, h, len, mat);
    group.add(along === "x" ? at(mesh, mid, ym, fixed) : at(mesh, fixed, ym, mid));
  };
  let cur = from;
  for (const o of cuts) {
    add(cur, o.a, y0, y1);
    add(o.a, o.b, y0, o.y0);      // below opening
    add(o.a, o.b, o.y1, y1);      // above opening
    cur = o.b;
  }
  add(cur, to, y0, y1);
}

function windowPane(group, along, fixed, a, b, y0, y1, frameMat, glassMat) {
  const w = b - a, h = y1 - y0, mid = (a + b) / 2, ym = (y0 + y1) / 2;
  const frame = along === "x" ? block(w, h, 0.08, frameMat) : block(0.08, h, w, frameMat);
  const glass = along === "x" ? block(w - 0.14, h - 0.14, 0.09, glassMat) : block(0.09, h - 0.14, w - 0.14, glassMat);
  const bar = along === "x" ? block(0.06, h - 0.1, 0.1, frameMat) : block(0.1, h - 0.1, 0.06, frameMat);
  for (const m of [frame, glass, bar]) group.add(along === "x" ? at(m, mid, ym, fixed) : at(m, fixed, ym, mid));
  frame.castShadow = false;
}

export async function buildWorld(scene) {
  const [plaster, parquet, roof, grass, pavers, concrete, asphalt] = await Promise.all([
    texture("painted_plaster_wall", [1, 1]),
    texture("herringbone_parquet", [1, 1]),
    texture("clay_roof_tiles", [1, 1]),
    texture("leafy_grass", [110, 110]),
    texture("brick_pavement_02", [1, 1]),
    texture("concrete_floor_02", [1, 1]),
    texture("asphalt_02", [1, 1]),
  ]);
  const M = {
    // Plain white render: only the plaster relief (normal map), no stained colour map.
    plaster: new THREE.MeshStandardMaterial({ normalMap: plaster.normalMap, normalScale: new THREE.Vector2(0.35, 0.35), color: "#f3f1ec", roughness: 0.95 }),
    inner: new THREE.MeshStandardMaterial({ normalMap: plaster.normalMap, normalScale: new THREE.Vector2(0.25, 0.25), color: "#f1ede6", roughness: 0.95 }),
    parquet: new THREE.MeshStandardMaterial({ ...parquet, roughness: 0.6 }),
    roof: new THREE.MeshStandardMaterial({ ...roof, roughness: 0.8 }),
    grass: new THREE.MeshStandardMaterial({ normalMap: grass.normalMap, normalScale: new THREE.Vector2(0.8, 0.8), color: "#9dbb79", roughness: 1 }),
    pavers: new THREE.MeshStandardMaterial({ normalMap: concrete.normalMap, color: "#e9e6e0", roughness: 0.9 }),
    drive: new THREE.MeshStandardMaterial({ normalMap: pavers.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), color: "#d6d1c8", roughness: 0.9 }),
    kerb: new THREE.MeshStandardMaterial({ color: "#c9c6c0", roughness: 0.85 }),
    line: new THREE.MeshStandardMaterial({ color: "#f2f2ee", roughness: 0.7 }),
    // Cut edges of floors, plinth and roof: plain, so the section reads cleanly.
    concrete: new THREE.MeshStandardMaterial({ color: "#d2cec7", roughness: 0.95 }),
    asphalt: new THREE.MeshStandardMaterial({ ...asphalt, roughness: 0.95 }),
    frame: new THREE.MeshStandardMaterial({ color: "#f7f7f5", roughness: 0.4 }),
    glass: new THREE.MeshStandardMaterial({ color: "#a9c4cf", roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.55 }),
    door: new THREE.MeshStandardMaterial({ color: "#8a5a32", roughness: 0.55 }),
    gutter: new THREE.MeshStandardMaterial({ color: "#8d9396", roughness: 0.4, metalness: 0.6 }),
  };
  const world = new THREE.Group(); scene.add(world);

  // Ground, paths, driveway beside the house, pavement and street
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.grass);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  const slab = (x0, x1, z0, z1, mat, y = 0.025, tile = 1.2, h = 0.05) => world.add(at(block(x1 - x0, h, z1 - z0, mat, tile), (x0 + x1) / 2, y, (z0 + z1) / 2));
  slab(-7.9, -6.3, 1.0, 2.9, M.pavers);           // from the front door
  slab(-9.6, -6.3, 1.9, 2.9, M.pavers, 0.026);    // across to the drive
  slab(-13.4, -9.6, -9.0, 6.4, M.drive, 0.024);   // driveway
  slab(-90, 90, 6.4, 7.55, M.pavers, 0.023);      // pavement
  slab(-90, 90, 7.55, 7.7, M.kerb, 0.03, 1, 0.06);
  slab(-90, 90, 7.7, 14.0, M.asphalt, 0.02, 3);   // street
  for (let x = -90; x < 90; x += 4) slab(x, x + 2, 10.8, 10.92, M.line, 0.046, 1, 0.004);

  const { x0, x1, z0, z1, floor0, floor1, slab: st, eaves, ridge, wall: t } = H;
  const house = new THREE.Group(); world.add(house);
  // Plinth and floors (cut edges in concrete)
  house.add(at(block(x1 - x0, floor0, z1 - z0, [M.concrete, M.concrete, M.parquet, M.concrete, M.concrete, M.concrete]), (x0 + x1) / 2, floor0 / 2, (z0 + z1) / 2));
  // Upper floor slab, inset a few millimetres so it never shares a face with the walls
  const e = 0.004;
  house.add(at(block(x1 - x0 - 2 * e, st, z1 - z0 - 2 * e, [M.concrete, M.concrete, M.parquet, M.inner, M.concrete, M.concrete]), (x0 + x1) / 2, floor1 - st / 2, (z0 + z1) / 2));
  // Front wall only in front of the hallway: the rooms are shown in section.
  const xp = H.partitionX + 0.075;
  const doorO = { a: H.frontDoor[0], b: H.frontDoor[1], y0: floor0, y1: 2.45 };
  const win = (a, b, y0, y1) => ({ a, b, y0, y1 });
  const frontOpenings0 = [win(-8.75, -8.15, 1.1, 2.3), doorO];
  const frontOpenings1 = [win(-8.4, -7.4, 3.8, 5.0)];
  wall(house, M.plaster, { along: "x", fixed: z1 - t / 2, from: x0, to: xp, y0: floor0, y1: floor1, t, openings: frontOpenings0 });
  wall(house, M.plaster, { along: "x", fixed: z1 - t / 2, from: x0, to: xp, y0: floor1, y1: eaves, t, openings: frontOpenings1 });
  wall(house, M.inner, { along: "x", fixed: z0 + t / 2, from: x0, to: x1, y0: floor0, y1: eaves, t, openings: [win(-4.6, -3.4, 1.1, 2.3), win(-4.6, -3.4, 3.8, 5.0)] });
  wall(house, M.plaster, { along: "z", fixed: x0 + t / 2, from: z0, to: z1, y0: floor0, y1: eaves, t, openings: [win(-2.6, -1.4, 1.1, 2.3)] });
  const sideOpenings = [win(-3.6, -2.4, 1.1, 2.3), win(-3.6, -2.4, 3.8, 5.0)];
  wall(house, M.plaster, { along: "z", fixed: x1 - t / 2, from: z0, to: z1, y0: floor0, y1: eaves, t, openings: sideOpenings });
  for (const o of [frontOpenings0[0], ...frontOpenings1]) windowPane(house, "x", z1 - t / 2, o.a, o.b, o.y0, o.y1, M.frame, M.glass);
  for (const o of sideOpenings) windowPane(house, "z", x1 - t / 2, o.a, o.b, o.y0, o.y1, M.frame, M.glass);
  windowPane(house, "x", z0 + t / 2, -4.6, -3.4, 1.1, 2.3, M.frame, M.glass);
  windowPane(house, "x", z0 + t / 2, -4.6, -3.4, 3.8, 5.0, M.frame, M.glass);
  // Partition walls hiding the hallway, each with a doorway near the front
  const pd = { a: H.innerDoor[0], b: H.innerDoor[1] };
  wall(house, M.inner, { along: "z", fixed: H.partitionX, from: z0, to: z1, y0: floor0, y1: floor1 - st, t: 0.15, openings: [{ ...pd, y0: floor0, y1: 2.35 }] });
  wall(house, M.inner, { along: "z", fixed: H.partitionX, from: z0, to: z1, y0: floor1, y1: eaves, t: 0.15, openings: [{ ...pd, y0: floor1, y1: floor1 + 2.05 }] });
  // Front door, standing open into the hallway
  const door = block(1.0, 2.15, 0.06, M.door);
  const hinge = new THREE.Group(); hinge.position.set(H.frontDoor[0], floor0, z1 - t);
  door.position.set(0.5, 1.075, 0); hinge.add(door); hinge.rotation.y = Math.PI / 2 - 0.05; house.add(hinge);
  house.add(at(block(1.4, 0.15, 0.6, M.concrete), (H.frontDoor[0] + H.frontDoor[1]) / 2, 0.075, z1 + 0.3)); // step

  // Gable roof (ridge along x) with overhangs; tiles on top, plaster underneath
  const ox = 0.4, oz = 0.4, zc = (z0 + z1) / 2, rise = ridge - eaves, halfSpan = (z1 - z0) / 2;
  const ang = Math.atan2(rise, halfSpan), th = 0.22;
  for (const side of [1, -1]) {
    // From the ridge to the eave edge (including the overhang), along the slope.
    const ez = zc + side * (halfSpan + oz), ey = eaves - oz * Math.tan(ang);
    const len = Math.hypot(ez - zc, ridge - ey);
    const r = block(x1 - x0 + 2 * ox, th, len, [M.concrete, M.concrete, M.roof, M.inner, M.concrete, M.concrete], 1.4);
    r.rotation.x = side * ang;
    const n = new THREE.Vector3(0, Math.cos(ang), side * Math.sin(ang)).multiplyScalar(th / 2);
    r.position.set((x0 + x1) / 2, (ridge + ey) / 2 + n.y, (zc + ez) / 2 + n.z);
    house.add(r);
  }
  // Gable triangles at both ends
  const tri = new THREE.Shape([new THREE.Vector2(z0, eaves), new THREE.Vector2(z1, eaves), new THREE.Vector2(zc, ridge)]);
  const gable = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: t, bevelEnabled: false }), M.plaster);
  gable.rotation.y = -Math.PI / 2; gable.position.x = x0 + t; gable.castShadow = true; gable.receiveShadow = true;
  const g2 = gable.geometry.attributes.uv; for (let i = 0; i < g2.count; i++) g2.setXY(i, g2.getX(i), g2.getY(i));
  house.add(gable);
  const rightGable = gable.clone(); rightGable.position.x = x1; house.add(rightGable);
  const partitionGable = gable.clone(); partitionGable.material = M.inner; partitionGable.position.x = H.partitionX + 0.075; partitionGable.scale.z = 0.6; house.add(partitionGable);
  // Gutter along the front eaves
  const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, x1 - x0 + 2 * ox, 10), M.gutter);
  gut.rotation.z = Math.PI / 2; gut.position.set((x0 + x1) / 2, eaves - 0.1, z1 + oz - 0.05); house.add(gut);

  return { world, house };
}
