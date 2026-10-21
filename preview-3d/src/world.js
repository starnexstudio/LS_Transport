// The street scene: a two-storey detached house shown in section (front wall
// removed), its plot with driveway, the pavement and street, and neighbours.
// Units are metres; +x right, +z towards the street and the camera.
import * as THREE from "three";
import { texture, surface, model } from "./assets.js";
import { mergeStatic } from "./merge.js";

export const HOUSE = {
  x0: -10, x1: -1, z0: -5.5, z1: 1.0, t: 0.36, // outer footprint (front cut at z1), wall thickness
  F0: 0.45, C0: 3.05, F1: 3.35, C1: 5.85, eaves: 6.05, partX: -5.5,
};
export const STREET = { pave0: 6.0, kerb: 7.8, road0: 8.0, road1: 14.5, drive: [-14.9, -11.1] };

// Box whose UVs are in metres on every face, so tiled textures keep their scale.
function blockGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, uv.getX(i) * faces[f][0], uv.getY(i) * faces[f][1]); }
  return g;
}
function block(w, h, d, mat, x, y, z, parent, { cast = true } = {}) {
  const m = new THREE.Mesh(blockGeo(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true;
  parent.add(m);
  return m;
}
const flat = (w, d, mat, x, y, z, parent) => block(w, 0.04, d, mat, x, y - 0.02, z, parent, { cast: false });

// Wall along x (constant z) or along z (constant x) with rectangular openings.
// `pos`/`neg`: materials of the faces towards +/− normal; `end`: the face at the section cut.
function wall(parent, { along, at, from, to, y0, y1, t, openings = [], pos, neg, edge, end, cutAt }) {
  const add = (a, b, ya, yb) => {
    if (b - a < 0.005 || yb - ya < 0.005) return;
    const len = b - a, h = yb - ya, mid = (a + b) / 2, ym = (ya + yb) / 2;
    if (along === "x") block(len, h, t, [edge, edge, edge, edge, pos, neg], mid, ym, at, parent);
    else block(t, h, len, [pos, neg, edge, edge, cutAt != null && Math.abs(b - cutAt) < 1e-3 ? end : edge, edge], at, ym, mid, parent);
  };
  let cur = from;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    add(cur, o.a, y0, y1); add(o.a, o.b, y0, o.y0); add(o.a, o.b, o.y1, y1); cur = o.b;
  }
  add(cur, to, y0, y1);
}

// PVC window: frame, mullion, glass, outer aluminium sill, inner sill.
function windowUnit(parent, M, along, at, a, b, y0, y1, outward) {
  const w = b - a, h = y1 - y0, mid = (a + b) / 2, ym = (y0 + y1) / 2, fr = 0.07, d = 0.08;
  const g = new THREE.Group(); parent.add(g);
  const place = (m, u, y, n) => { if (along === "x") m.position.set(u, y, at + n); else m.position.set(at + n, y, u); g.add(m); m.castShadow = true; m.receiveShadow = true; };
  const bx = (sx, sy, sz, mat) => new THREE.Mesh(along === "x" ? new THREE.BoxGeometry(sx, sy, sz) : new THREE.BoxGeometry(sz, sy, sx), mat);
  const n0 = outward * 0.06; // frames sit towards the outside of the wall
  place(bx(w, fr, d, M.frame), mid, y0 + fr / 2, n0); place(bx(w, fr, d, M.frame), mid, y1 - fr / 2, n0);
  place(bx(fr, h, d, M.frame), a + fr / 2, ym, n0); place(bx(fr, h, d, M.frame), b - fr / 2, ym, n0);
  place(bx(0.06, h - 2 * fr, d, M.frame), mid, ym, n0);
  const glass = bx(w - 2 * fr, h - 2 * fr, 0.012, M.glass); place(glass, mid, ym, n0); glass.castShadow = false;
  place(bx(w + 0.1, 0.03, 0.2, M.sill), mid, y0 - 0.015, outward * 0.24);
  place(bx(w + 0.06, 0.025, 0.2, M.trim), mid, y0 - 0.012, -outward * 0.1);
}

// A gable roof (ridge along x) with tiles on top and timber underneath; gutters on both eaves.
function roof(parent, M, { x0, x1, z0, z1, eaves, pitch = 38, ox = 0.45, oz = 0.55, th = 0.26 }) {
  const zc = (z0 + z1) / 2, half = (z1 - z0) / 2, ang = THREE.MathUtils.degToRad(pitch), ridge = eaves + half * Math.tan(ang);
  for (const side of [1, -1]) {
    const ez = zc + side * (half + oz), ey = eaves - oz * Math.tan(ang);
    const len = Math.hypot(ez - zc, ridge - ey);
    const r = block(x1 - x0 + 2 * ox, th, len, [M.fascia, M.fascia, M.roof, M.soffit, M.fascia, M.fascia], 0, 0, 0, parent);
    r.rotation.x = side * ang;
    const n = new THREE.Vector3(0, Math.cos(ang), side * Math.sin(ang)).multiplyScalar(th / 2);
    r.position.set((x0 + x1) / 2, (ridge + ey) / 2 + n.y, (zc + ez) / 2 + n.z);
    const gut = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, x1 - x0 + 2 * ox, 14, 1, true, 0, Math.PI), M.metal);
    gut.rotation.z = -Math.PI / 2; // half pipe, open side up
    gut.position.set((x0 + x1) / 2, ey - 0.04, ez + side * 0.06); gut.material.side = THREE.DoubleSide; parent.add(gut);
  }
  block(x1 - x0 + 2 * ox, 0.1, 0.3, M.roofRidge, (x0 + x1) / 2, ridge + 0.17, zc, parent);
  // Gable triangles at both ends
  const tri = new THREE.Shape([new THREE.Vector2(z0, eaves), new THREE.Vector2(z1, eaves), new THREE.Vector2(zc, ridge)]);
  for (const [x, flip] of [[x0, 1], [x1, -1]]) {
    const g = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.36, bevelEnabled: false }), M.render);
    g.rotation.y = -Math.PI / 2; g.position.x = flip > 0 ? x + 0.36 : x; g.castShadow = g.receiveShadow = true; parent.add(g);
  }
  return ridge;
}

// Downpipe from the gutter to the ground.
function downpipe(parent, M, x, z, top) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, top, 12), M.metal);
  p.position.set(x, top / 2, z); p.castShadow = true; parent.add(p);
}

function bin(parent, color, x, z, yaw) {
  const g = new THREE.Group(); g.position.set(x, 0.02, z); g.rotation.y = yaw; parent.add(g);
  const plastic = new THREE.MeshStandardMaterial({ color, roughness: 0.55 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.95, 0.7), plastic); body.position.y = 0.52; g.add(body);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.05, 0.76), plastic); lid.position.set(0, 1.02, -0.02); g.add(lid);
  const wheelG = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16); wheelG.rotateZ(Math.PI / 2);
  for (const s of [-1, 1]) { const w = new THREE.Mesh(wheelG, new THREE.MeshStandardMaterial({ color: "#151515", roughness: 0.9 })); w.position.set(s * 0.25, 0.1, -0.33); g.add(w); }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
}

// A house with the shared materials, built at HOUSE's coordinates (move the group to
// place it elsewhere). `open` removes the front wall for the section view; `hole` is
// the stair opening in the upper floor.
function house(parent, M, H, { open, wallColor, hole }) {
  const g = new THREE.Group(); parent.add(g);
  const { x0, x1, z0, z1, t, F0, C0, F1, C1, eaves, partX } = H;
  const render = wallColor ? Object.assign(M.render.clone(), { color: new THREE.Color(wallColor) }) : M.render;
  const Mh = { ...M, render };
  const win = (a, b, y0, y1) => ({ a, b, y0, y1 });
  // Plinth and floor slabs; their front faces are cut edges
  block(x1 - x0, F0, z1 - z0, [M.plinth, M.plinth, M.floor0, M.plinth, open ? M.cut : M.plinth, M.plinth], (x0 + x1) / 2, F0 / 2, (z0 + z1) / 2, g);
  const e = 0.004;
  const slab = (xa, xb, za, zb, yb, yt, top) => block(xb - xa, yt - yb, zb - za, [M.cut, M.cut, top, M.ceiling, M.cut, M.cut], (xa + xb) / 2, (yb + yt) / 2, (za + zb) / 2, g);
  if (hole) { // upper floor in four pieces round the stair opening
    slab(x0 + e, hole.x0, z0 + e, z1 - e, C0, F1, M.floor1); slab(hole.x1, x1 - e, z0 + e, z1 - e, C0, F1, M.floor1);
    slab(hole.x0, hole.x1, hole.z1, z1 - e, C0, F1, M.floor1); slab(hole.x0, hole.x1, z0 + e, hole.z0, C0, F1, M.floor1);
  } else slab(x0 + e, x1 - e, z0 + e, z1 - e, C0, F1, M.floor1);
  slab(x0 + e, x1 - e, z0 + e, z1 - e, C1, eaves, M.cut);
  // Exterior walls (render outside, paint inside, grey section at the cut)
  const back0 = [win(-9.0, -7.8, 1.35, 2.75), win(-4.4, -3.2, 1.35, 2.75), win(-2.5, -1.9, 1.35, 2.75)];
  const back1 = [win(-9.0, -7.8, 4.25, 5.45), win(-3.7, -2.3, 4.25, 5.45)];
  wall(g, { along: "x", at: z0 + t / 2, from: x0, to: x1, y0: 0, y1: eaves, t, openings: [...back0, ...back1], pos: M.paint, neg: render, edge: render });
  const left = [win(-3.3, -2.1, 1.35, 2.75), win(-3.3, -2.1, 4.25, 5.45), { a: -1.4, b: -0.4, y0: F0, y1: 2.6 }];
  wall(g, { along: "z", at: x0 + t / 2, from: z0, to: z1, y0: 0, y1: eaves, t, openings: left, pos: M.paint, neg: render, edge: render, end: M.cut, cutAt: z1 });
  const right = [win(-3.0, -1.8, 1.35, 2.75), win(-3.0, -1.8, 4.25, 5.45)];
  wall(g, { along: "z", at: x1 - t / 2, from: z0, to: z1, y0: 0, y1: eaves, t, openings: right, pos: render, neg: M.paint, edge: render, end: M.cut, cutAt: z1 });
  if (!open) {
    const front = [win(-8.8, -7.4, 1.35, 2.75), win(-4.6, -2.0, 1.35, 2.75), win(-8.8, -7.4, 4.25, 5.45), win(-4.0, -2.6, 4.25, 5.45), { a: -6.3, b: -5.3, y0: F0, y1: 2.6 }];
    wall(g, { along: "x", at: z1 - t / 2, from: x0, to: x1, y0: 0, y1: eaves, t, openings: front, pos: render, neg: M.paint, edge: render });
    for (const o of front.slice(0, 4)) windowUnit(g, Mh, "x", z1 - t / 2, o.a, o.b, o.y0, o.y1, 1);
    block(1.0, 2.15, 0.06, M.door, -5.8, F0 + 1.075, z1 - 0.06, g);
  }
  for (const o of [...back0, ...back1]) windowUnit(g, Mh, "x", z0 + t / 2, o.a, o.b, o.y0, o.y1, -1);
  for (const o of left.slice(0, 2)) windowUnit(g, Mh, "z", x0 + t / 2, o.a, o.b, o.y0, o.y1, -1);
  for (const o of right) windowUnit(g, Mh, "z", x1 - t / 2, o.a, o.b, o.y0, o.y1, 1);
  // Side entrance: door, two steps, glass canopy
  block(0.06, 2.15, 1.0, M.door, x0 + 0.1, F0 + 1.075, -0.9, g);
  block(0.03, 0.03, 0.03, M.metal, x0 + 0.06, F0 + 1.05, -0.55, g);
  block(0.5, 0.15, 1.4, M.plinth, x0 - 0.25, 0.075, -0.9, g); block(0.28, 0.15, 1.4, M.plinth, x0 - 0.14, 0.225, -0.9, g);
  block(1.0, 0.03, 1.5, M.glass, x0 - 0.5, 2.95, -0.9, g); for (const z of [-1.6, -0.2]) block(1.0, 0.04, 0.04, M.metal, x0 - 0.5, 2.93, z, g);
  // Plinth band on the outside walls
  const pl = 0.5;
  block(0.03, pl, z1 - z0 + 0.03, M.plinth, x0 - 0.015, pl / 2, (z0 + z1) / 2, g);
  block(0.03, pl, z1 - z0 + 0.03, M.plinth, x1 + 0.015, pl / 2, (z0 + z1) / 2, g);
  block(x1 - x0 + 0.06, pl, 0.03, M.plinth, (x0 + x1) / 2, pl / 2, z0 - 0.015, g);
  const ridge = roof(g, Mh, { x0, x1, z0, z1, eaves });
  for (const [x, z] of [[x0 + 0.08, z1 + 0.62], [x1 - 0.08, z1 + 0.62], [x0 + 0.08, z0 - 0.62], [x1 - 0.08, z0 - 0.62]]) downpipe(g, M, x, z, eaves - 0.45);
  // Chimney on the back slope
  const ch = block(0.6, 1.9, 0.6, render, -3.2, ridge - 0.45, -3.0, g);
  block(0.72, 0.08, 0.72, M.metal, -3.2, ch.position.y + 0.99, -3.0, g);
  return g;
}

export async function buildWorld(scene, { lowDetail = false } = {}) {
  const [grass, asphalt, pavers, drive, granite, renderT, paintT, roofT, parquet, oak, conc] = await Promise.all([
    texture("leafy_grass"), texture("asphalt_04"), texture("concrete_pavers_02", { gray: 0.9 }), texture("interlocking_concrete_pavers", { gray: 0.85 }), texture("granite_tile_04"),
    texture("beige_wall_001"), texture("beige_wall_002"), texture("ceramic_roof_01", { gray: 1 }), texture("herringbone_parquet"), texture("grey_oak_veneer_01"), texture("concrete_floor_02"),
  ]);
  const M = {
    grass: surface(grass, { tile: 2.0, color: "#9ec46f", roughness: 1 }),
    asphalt: surface(asphalt, { tile: 3.5, color: "#c2c2c2", roughness: 0.95 }),
    pavers: surface(pavers, { tile: 1.6, color: "#e4e4e2", roughness: 0.9 }),
    drive: surface(drive, { tile: 1.1, color: "#d2d2d0", roughness: 0.9 }),
    kerb: surface(granite, { tile: 1.0, color: "#dcdcdc", roughness: 0.75 }),
    render: surface(renderT, { tile: 2.0, color: "#ffffff", roughness: 0.95, normalScale: 0.6 }),
    paint: surface(paintT, { tile: 2.0, color: "#f6f3ee", roughness: 0.95, normalScale: 0.3, noMap: true }),
    accent: surface(paintT, { tile: 2.0, color: "#9fb3aa", roughness: 0.95, normalScale: 0.3, noMap: true }),
    roof: surface(roofT, { tile: 1.3, color: "#7d7f82", roughness: 0.7 }),
    roofRidge: surface(roofT, { tile: 0.6, color: "#6a6c6f", roughness: 0.7 }),
    floor0: surface(parquet, { tile: 1.3, roughness: 0.55 }),
    floor1: surface(oak, { tile: 1.4, color: "#e2d6c4", roughness: 0.6 }),
    plinth: surface(conc, { tile: 1.5, color: "#8e8f8d", roughness: 0.9 }),
    cut: new THREE.MeshStandardMaterial({ color: "#d6d0c6", roughness: 0.95 }),
    ceiling: new THREE.MeshStandardMaterial({ color: "#f7f6f2", roughness: 0.95 }),
    soffit: new THREE.MeshStandardMaterial({ color: "#f3f1ec", roughness: 0.9 }),
    fascia: new THREE.MeshStandardMaterial({ color: "#3a3d40", roughness: 0.6 }),
    metal: new THREE.MeshStandardMaterial({ color: "#4a4e52", metalness: 0.6, roughness: 0.45 }),
    frame: new THREE.MeshStandardMaterial({ color: "#f7f7f5", roughness: 0.35 }),
    trim: new THREE.MeshStandardMaterial({ color: "#f4f3ef", roughness: 0.5 }),
    sill: new THREE.MeshStandardMaterial({ color: "#5d6266", metalness: 0.5, roughness: 0.45 }),
    glass: new THREE.MeshPhysicalMaterial({ color: "#a9c2cb", roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.32, clearcoat: 1 }),
    door: new THREE.MeshStandardMaterial({ color: "#2f3436", roughness: 0.45 }),
    wood: surface(oak, { tile: 1.0, color: "#c9a77f", roughness: 0.55 }),
  };
  const world = new THREE.Group(); world.name = "World"; scene.add(world);
  const H = HOUSE, S = STREET;

  // ---------- Ground ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), M.grass);
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  const uv = ground.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 400, uv.getY(i) * 400);
  world.add(ground);
  flat(160, S.road1 - S.road0, M.asphalt, 0, 0.02, (S.road0 + S.road1) / 2, world);
  flat(160, S.kerb - S.pave0, M.pavers, 0, 0.12, (S.pave0 + S.kerb) / 2, world);
  flat(160, 1.8, M.pavers, 0, 0.12, S.road1 + 0.2 + 0.9, world);
  // Granite kerbs, lowered at the drive
  const [d0, d1] = S.drive;
  for (const [a, b, h] of [[-80, d0, 0.14], [d0, d1, 0.05], [d1, 80, 0.14]]) block(b - a, h, 0.2, M.kerb, (a + b) / 2, h / 2, S.kerb + 0.1, world);
  block(160, 0.14, 0.2, M.kerb, 0, 0.07, S.road1 + 0.1, world);
  flat(d1 - d0, S.pave0 + 9, M.drive, (d0 + d1) / 2, 0.05, (S.pave0 - 9) / 2, world);
  flat(d1 - d0, S.kerb - S.pave0, M.drive, (d0 + d1) / 2, 0.125, (S.pave0 + S.kerb) / 2, world);
  // Path to the side door and a gravel strip round the house
  flat(1.0, 3.2, M.pavers, d1 + 0.5, 0.05, -0.9, world);
  // Manholes in the street
  for (const x of [-6, 18]) {
    const mh = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.02, 28), new THREE.MeshStandardMaterial({ color: "#3b3c3d", metalness: 0.6, roughness: 0.6 }));
    mh.position.set(x, 0.045, 11.6); mh.receiveShadow = true; world.add(mh);
  }

  // ---------- The house (open) and neighbours ----------
  const { x0, x1, z0, z1, t, F0, C0, F1, C1, partX } = H;
  const ix0 = x0 + t, ix1 = x1 - t, iz0 = z0 + t;
  const steps = 14, rise = (F1 - F0) / steps, run = 0.25, sx0 = ix0 + 0.05, sw = 1.0, sxEnd = sx0 + steps * run;
  house(world, M, H, { open: true, hole: { x0: sxEnd - 2.4, x1: sxEnd, z0: iz0, z1: iz0 + sw } });
  for (const [dx, dz, color] of [[-18.5, -1.5, "#efe9dc"], [15.5, -2.0, "#e7ebec"]]) house(world, M, H, { open: false, wallColor: color }).position.set(dx, 0, dz);

  // ---------- Interior fit-out ----------
  for (const [yb, yt] of [[F0, C0], [F1, C1]]) {
    wall(world, { along: "z", at: partX, from: iz0, to: z1, y0: yb, y1: yt, t: 0.12, openings: [{ a: -1.1, b: -0.2, y0: yb, y1: yb + 2.1 }], pos: M.accent, neg: M.paint, edge: M.trim, end: M.cut, cutAt: z1 });
    // Door frame
    for (const z of [-1.1, -0.2]) block(0.16, 2.1, 0.05, M.trim, partX, yb + 1.05, z, world);
    block(0.16, 0.05, 0.95, M.trim, partX, yb + 2.12, -0.65, world);
    // Skirting boards
    for (const [x, len] of [[(ix0 + partX) / 2, partX - ix0], [(partX + ix1) / 2, ix1 - partX]]) block(len, 0.07, 0.015, M.trim, x, yb + 0.035, iz0 + 0.008, world);
    for (const x of [ix0 + 0.008, ix1 - 0.008]) block(0.015, 0.07, z1 - iz0, M.trim, x, yb + 0.035, (iz0 + z1) / 2, world);
  }
  // Staircase in the left room, along the back wall, with the opening above it
  for (let i = 0; i < steps; i++) {
    const x = sx0 + i * run + run / 2, y = F0 + (i + 1) * rise;
    block(run + 0.02, 0.04, sw, M.wood, x, y - 0.02, iz0 + sw / 2, world);
    block(0.02, rise, sw, M.trim, x - run / 2 + 0.01, y - rise / 2, iz0 + sw / 2, world);
  }
  const stringer = block(Math.hypot(steps * run, F1 - F0), 0.25, 0.05, M.trim, sx0 + (steps * run) / 2, (F0 + F1) / 2, iz0 + sw + 0.02, world);
  stringer.rotation.z = Math.atan2(F1 - F0, steps * run);
  // Railing round the stair opening upstairs
  for (let x = sxEnd - 2.4; x <= sxEnd + 0.01; x += 0.12) block(0.02, 0.9, 0.02, M.trim, x, F1 + 0.45, iz0 + sw + 0.05, world);
  for (let z = iz0 + 0.06; z <= iz0 + sw; z += 0.12) block(0.02, 0.9, 0.02, M.trim, sxEnd - 2.42, F1 + 0.45, z, world);
  block(2.5, 0.05, 0.06, M.wood, sxEnd - 1.2, F1 + 0.92, iz0 + sw + 0.05, world);
  block(0.06, 0.05, sw, M.wood, sxEnd - 2.42, F1 + 0.92, iz0 + sw / 2, world);

  // ---------- Fixtures and outside props ----------
  const lampModel = await model("modern_ceiling_lamp_01", { texSize: 256, shadows: false });
  for (const [x, z, c] of [[-3.4, -2.6, C0], [-7.6, -2.0, C0], [-3.2, -2.4, C1], [-7.6, -1.8, C1]]) {
    const l = lampModel.clone(); l.position.set(x, c - lampModel.userData.size.y, z); world.add(l);
  }
  // Low granite edging along the front garden
  const fenceMat = new THREE.MeshStandardMaterial({ color: "#33373a", metalness: 0.5, roughness: 0.5 });
  block(2.0 - d1 - 0.3, 0.3, 0.2, M.kerb, (d1 + 0.3 + 2.0) / 2, 0.15, S.pave0 - 0.12, world);
  bin(world, "#4d5357", -10.75, 4.6, Math.PI); bin(world, "#2f5c9e", -10.75, 3.85, Math.PI); bin(world, "#6a4b33", -10.75, 3.1, Math.PI);
  // Letterbox
  block(0.06, 1.1, 0.06, fenceMat, d1 + 0.25, 0.6, S.pave0 - 0.15, world);
  block(0.36, 0.42, 0.18, new THREE.MeshStandardMaterial({ color: "#2f3436", roughness: 0.4 }), d1 + 0.25, 1.2, S.pave0 - 0.15, world);

  const [lampPost, car, gardenSet, planter] = await Promise.all([
    model("street_lamp_01", { texSize: 512, shadows: false }), // thin and high-poly: not worth a shadow pass
    model("covered_car", { texSize: lowDetail ? 512 : 1024 }), model("outdoor_table_chair_set_01", { texSize: 512 }),
    model("planter_box_02", { texSize: 512 }),
  ]);
  for (const x of [-24, 6]) { const l = lampPost.clone(); l.position.set(x, 0.12, S.kerb - 0.35); l.rotation.y = Math.PI; world.add(l); }
  car.position.set(4.8, 0.02, S.road0 + 1.15); car.rotation.y = Math.PI / 2; world.add(car);
  gardenSet.position.set(0.6, 0, 2.6); gardenSet.rotation.y = 0.4; world.add(gardenSet);
  planter.position.set(d1 + 0.45, 0.05, 1.3); planter.rotation.y = Math.PI / 2; world.add(planter);
  mergeStatic(world, (o) => o.userData.model);
  return { world, M };
}
