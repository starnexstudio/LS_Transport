// The scene: one living room shown as a cutaway (front and right walls removed),
// packed full for the move, standing on the page's teal like a model. The cut shows
// the construction: plaster, masonry and render in the walls; concrete, screed and
// parquet in the floor.
// Units are metres; +x right (towards the van), +z towards the camera.
import * as THREE from "three";
import { texture, surface } from "./assets.js";
import { mergeStatic } from "./merge.js";

// Inside of the room: x0..x1 across, z0 (back wall) ..z1 (open front), floor top F,
// walls H high and t thick. The right side (x1) is open towards the van.
export const ROOM = { x0: -6.0, x1: 0.0, z0: -4.2, z1: 0.6, F: 0.3, H: 2.7, t: 0.2 };

// Soft contact shadow: a blurred dark rounded rectangle lying on the ground, the
// ambient occlusion where a footprint meets the floor that the sun's shadow misses.
export function contactShadow(w, d, x, z, strength = 0.5) {
  const res = 256, pad = 0.18, c = document.createElement("canvas");
  c.width = c.height = res;
  const g = c.getContext("2d");
  g.filter = `blur(${res * 0.05}px)`;
  g.fillStyle = "#00262c";
  const m = res * pad;
  g.beginPath(); g.roundRect(m, m, res - 2 * m, res - 2 * m, res * 0.06); g.fill();
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: strength, depthWrite: false, toneMapped: false });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w / (1 - 2 * pad), d / (1 - 2 * pad)), mat);
  plane.rotation.x = -Math.PI / 2; plane.position.set(x, 0.004, z); plane.renderOrder = -1;
  return plane;
}

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

// Window in the back wall and door in the left wall (sequence.js keeps the furniture clear of them).
export const OPENINGS = {
  window: { a: -1.3, b: -0.25, y0: ROOM.F + 0.9, y1: ROOM.F + 2.3 },
  door: { a: -3.45, b: -2.55, y0: ROOM.F, y1: ROOM.F + 2.05 },
};

// A wall in three layers, as the section shows them: inner plaster (painted on the
// room side), a masonry core and the outer render. `along` "x" or "z"; `inner` and
// `outer` are its two faces across the wall, a..b its length, y0..y1 its height.
// Openings { a, b, y0, y1 } get plastered reveals.
const PLASTER = 0.015;
function layeredWall(parent, M, { along, inner, outer, a, b, y0, y1, openings = [] }) {
  const s = Math.sign(outer - inner);
  const layers = [
    { p: inner, q: inner + s * PLASTER, cut: M.plaster, room: M.paint, away: M.plaster },
    { p: inner + s * PLASTER, q: outer - s * PLASTER, cut: M.core, room: M.core, away: M.core },
    { p: outer - s * PLASTER, q: outer, cut: M.render, room: M.render, away: M.render },
  ];
  for (const { p, q, cut, room, away } of layers) {
    const th = Math.abs(q - p), mid = (p + q) / 2;
    // The room lies on the +axis side when the outer face is on the negative side.
    const pos = s < 0 ? room : away, neg = s < 0 ? away : room;
    const seg = (u0, u1, v0, v1) => {
      if (u1 - u0 < 0.003 || v1 - v0 < 0.003) return;
      const len = u1 - u0, h = v1 - v0, um = (u0 + u1) / 2, vm = (v0 + v1) / 2;
      if (along === "x") block(len, h, th, [cut, cut, cut, cut, pos, neg], um, vm, mid, parent);
      else block(th, h, len, [pos, neg, cut, cut, cut, cut], mid, vm, um, parent);
    };
    let cur = a;
    for (const o of [...openings].sort((m, n) => m.a - n.a)) { seg(cur, o.a, y0, y1); seg(o.a, o.b, y0, o.y0); seg(o.a, o.b, o.y1, y1); cur = o.b; }
    seg(cur, b, y0, y1);
  }
  // Reveals: plaster lining the sides and head of each opening through the wall.
  const th = Math.abs(outer - inner), mid = (inner + outer) / 2, L = 0.012;
  for (const o of openings) {
    const h = o.y1 - o.y0, ym = (o.y0 + o.y1) / 2;
    for (const u of [o.a + L / 2, o.b - L / 2]) {
      if (along === "x") block(L, h, th, M.paint, u, ym, mid, parent); else block(th, h, L, M.paint, mid, ym, u, parent);
    }
    if (along === "x") block(o.b - o.a, L, th, M.paint, (o.a + o.b) / 2, o.y1 - L / 2, mid, parent);
    else block(th, L, o.b - o.a, M.paint, mid, o.y1 - L / 2, (o.a + o.b) / 2, parent);
  }
}

// Tilt-and-turn PVC window in a wall along x: frame, sash, double glazing, handle,
// window board inside and an aluminium sill outside. zIn is the room-side face.
function windowUnit(parent, M, { a, b, y0, y1 }, zIn, zOut) {
  const L = 0.012, ia = a + L, ib = b - L, by = y0 + 0.022, iy1 = y1 - L;
  const zc = (zIn + zOut) / 2 + 0.015, fw = 0.065, fd = 0.07, w = ib - ia, h = iy1 - by, xm = (ia + ib) / 2;
  // Window board inside (3 cm proud of the wall) and the sill outside
  block(b - a + 0.08, 0.022, zIn + 0.03 - (zc + fd / 2), M.board, (a + b) / 2, y0 + 0.011, (zIn + 0.03 + zc + fd / 2) / 2, parent);
  block(b - a + 0.06, 0.02, zc - fd / 2 - (zOut - 0.05), M.alu, (a + b) / 2, y0 + 0.01, (zc - fd / 2 + zOut - 0.05) / 2, parent);
  // Frame
  block(w, fw, fd, M.pvc, xm, by + fw / 2, zc, parent); block(w, fw, fd, M.pvc, xm, iy1 - fw / 2, zc, parent);
  for (const x of [ia + fw / 2, ib - fw / 2]) block(fw, h - 2 * fw, fd, M.pvc, x, (by + iy1) / 2, zc, parent);
  // Sash, a little proud of the frame on the room side
  const sa = ia + fw - 0.012, sb = ib - fw + 0.012, sy0 = by + fw - 0.012, sy1 = iy1 - fw + 0.012, sw = 0.06, sd = 0.062, zs = zc + 0.012;
  block(sb - sa, sw, sd, M.pvc, (sa + sb) / 2, sy0 + sw / 2, zs, parent); block(sb - sa, sw, sd, M.pvc, (sa + sb) / 2, sy1 - sw / 2, zs, parent);
  for (const x of [sa + sw / 2, sb - sw / 2]) block(sw, sy1 - sy0 - 2 * sw, sd, M.pvc, x, (sy0 + sy1) / 2, zs, parent);
  block(sb - sa - 2 * sw + 0.02, sy1 - sy0 - 2 * sw + 0.02, 0.024, M.glass, (sa + sb) / 2, (sy0 + sy1) / 2, zs, parent, { cast: false });
  // Handle on the right stile, pointing down (closed)
  const hx = sb - sw / 2, hy = (sy0 + sy1) / 2, hz = zs + sd / 2;
  block(0.032, 0.075, 0.012, M.pvc, hx, hy, hz + 0.006, parent);
  block(0.016, 0.012, 0.03, M.pvc, hx, hy, hz + 0.024, parent);
  block(0.02, 0.11, 0.016, M.pvc, hx, hy - 0.05, hz + 0.044, parent);
}

// Interior door in a wall along z: white frame lining the opening, architraves on the
// room side, the leaf, hinges, and a steel lever handle with its rose and key plate.
// xIn is the room-side face; the hinges are on the a side.
function doorUnit(parent, M, { a, b, y0, y1 }, xIn, xOut) {
  const L = 0.025, aw = 0.065, ap = 0.012, th = xIn - xOut, xm = (xIn + xOut) / 2;
  for (const z of [a + L / 2, b - L / 2]) block(th, y1 - y0, L, M.door, xm, (y0 + y1) / 2, z, parent);
  block(th, L, b - a, M.door, xm, y1 - L / 2, (a + b) / 2, parent);
  // Architraves
  const top = y1 - L + aw;
  block(ap, top - y0, aw, M.door, xIn + ap / 2, (y0 + top) / 2, a + L - aw / 2, parent);
  block(ap, top - y0, aw, M.door, xIn + ap / 2, (y0 + top) / 2, b - L + aw / 2, parent);
  block(ap, aw, b - a - 2 * L + 2 * aw, M.door, xIn + ap / 2, y1 - L + aw / 2, (a + b) / 2, parent);
  // Leaf, closed, near the room-side face
  const g = 0.003, lt = 0.04, la = a + L + g, lb = b - L - g, ly1 = y1 - L - g, lx = xIn - lt / 2 - 0.004;
  block(lt, ly1 - (y0 + 0.008), lb - la, M.door, lx, (ly1 + y0 + 0.008) / 2, (la + lb) / 2, parent);
  // Hinges on the a side
  for (const y of [y0 + 0.25, y0 + 1.8]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.11, 12), M.steel);
    hinge.position.set(xIn + 0.006, y, la + 0.004); parent.add(hinge);
  }
  // Lever handle and key plate on the b side
  const hz = lb - 0.075, hy = y0 + 1.05, rx = xIn - 0.002;
  const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 24), M.steel);
  rose.rotation.z = Math.PI / 2; rose.position.set(rx + 0.006, hy, hz); parent.add(rose);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.05, 12), M.steel);
  neck.rotation.z = Math.PI / 2; neck.position.set(rx + 0.035, hy, hz); parent.add(neck);
  const lever = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.12, 4, 12), M.steel);
  lever.rotation.x = Math.PI / 2; lever.position.set(rx + 0.058, hy, hz - 0.062); parent.add(lever);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 24), M.steel);
  plate.rotation.z = Math.PI / 2; plate.position.set(rx + 0.005, hy - 0.17, hz); parent.add(plate);
  block(0.004, 0.018, 0.006, M.dark, rx + 0.011, hy - 0.172, hz, parent);
}

// Type 22 panel radiator under the window: two ribbed panels, top grille, side covers,
// thermostatic valve and the two pipes from the floor. zWall is the wall's room face.
function radiator(parent, M, x0, x1, y0, y1, zWall, floor) {
  const zb = zWall + 0.045, d = 0.1, w = x1 - x0, h = y1 - y0, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
  block(w, h, 0.014, M.rad, xm, ym, zb + 0.007, parent);
  block(w, h, 0.014, M.rad, xm, ym, zb + d - 0.007, parent);
  for (let x = x0 + 0.018; x < x1 - 0.02; x += 0.033) block(0.016, h - 0.03, 0.006, M.rad, x + 0.008, ym, zb + d + 0.002, parent);
  block(w, 0.006, d - 0.006, M.radGrille, xm, y1 + 0.003, zb + d / 2, parent);
  for (const x of [x0 + 0.003, x1 - 0.003]) block(0.006, h, d, M.rad, x, ym, zb + d / 2, parent);
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.027, 0.029, 0.085, 24), M.rad);
  valve.rotation.z = Math.PI / 2; valve.position.set(x1 + 0.05, y1 - 0.075, zb + d / 2); parent.add(valve);
  block(0.02, 0.02, 0.02, M.steel, x1 + 0.006, y1 - 0.075, zb + d / 2, parent);
  for (const x of [x1 - 0.05, x1 - 0.1]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, y0 + 0.03 - floor, 10), M.rad);
    pipe.position.set(x, (floor + y0 + 0.03) / 2, zb + 0.035); parent.add(pipe);
  }
}

// Curtain panel drawn to one side: soft vertical folds, a little fuller at the hem,
// hanging from a black rod with brackets and finials.
function curtain(parent, M, x0, x1, top, bottom, z, rodTo) {
  const w = x1 - x0, h = top - bottom, geo = new THREE.PlaneGeometry(w, h, 64, 12), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / w + 0.5, v = p.getY(i) / h + 0.5, hem = 1 - v;
    p.setZ(i, (0.026 + 0.018 * hem) * (Math.sin(u * Math.PI * 7) + 0.3 * Math.sin(u * Math.PI * 15 + 1.3)));
    p.setX(i, p.getX(i) * (0.93 + 0.1 * hem));
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, M.curtain); m.position.set((x0 + x1) / 2, (top + bottom) / 2, z);
  m.castShadow = m.receiveShadow = true; parent.add(m);
  const ry = top + 0.03, rod = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, rodTo - x0 + 0.1, 12), M.rod);
  rod.rotation.z = Math.PI / 2; rod.position.set((x0 - 0.05 + rodTo + 0.05) / 2, ry, z); parent.add(rod);
  for (const x of [x0 - 0.02, rodTo + 0.02]) {
    block(0.02, 0.02, z - (ROOM.z0 + 0.005), M.rod, x, ry, (z + ROOM.z0) / 2, parent);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 8), M.rod); fin.position.set(x < x0 ? x0 - 0.07 : rodTo + 0.07, ry, z); parent.add(fin);
  }
}

export async function buildWorld(scene) {
  const [paintT, parquet, plasterT, concreteT] = await Promise.all([
    texture("beige_wall_002"), texture("herringbone_parquet"), texture("painted_plaster_wall"), texture("concrete_floor_02", { gray: 1 }),
  ]);
  const std = (color, roughness, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
  const M = {
    paint: surface(paintT, { tile: 2.0, color: "#ede9e1", roughness: 0.95, normalScale: 0.35, noMap: true }),
    plaster: std("#ebe8e2", 1),
    core: surface(plasterT, { tile: 1.2, color: "#dcd8d0", roughness: 1, normalScale: 0.5 }),
    render: std("#e6e2da", 1),
    concrete: surface(concreteT, { tile: 1.6, color: "#c4c1bb", roughness: 1, normalScale: 0.6 }),
    screed: std("#d2cec6", 1),
    floor: surface(parquet, { tile: 1.3, roughness: 0.55 }),
    woodEdge: std("#8d6a46", 0.7),
    trim: std("#f4f3ef", 0.5),
    pvc: std("#f7f7f5", 0.35),
    glass: new THREE.MeshPhysicalMaterial({ color: "#d3e4e6", roughness: 0.02, metalness: 0, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false }),
    board: std("#f1efea", 0.3),
    alu: std("#9da1a5", 0.35, { metalness: 0.7 }),
    door: std("#f2f1ec", 0.42),
    steel: std("#c9cbcd", 0.28, { metalness: 1 }),
    dark: std("#1b1b1b", 0.6),
    rad: std("#f5f5f2", 0.32),
    radGrille: std("#dfdfdb", 0.5),
    curtain: std("#ebe5d8", 0.95, { side: THREE.DoubleSide }),
    rod: std("#2a2a2a", 0.4, { metalness: 0.6 }),
  };
  const world = new THREE.Group(); world.name = "World"; scene.add(world);
  const { x0, x1, z0, z1, F, H, t } = ROOM, { window: win, door } = OPENINGS;

  // ---------- Ground: invisible, it only catches shadows; the page's teal shows through ----------
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), new THREE.ShadowMaterial({ color: "#00313a", opacity: 0.5 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  world.add(contactShadow(x1 - x0 + t + 0.6, z1 - z0 + t + 0.6, (x0 - t + x1) / 2, (z0 - t + z1) / 2, 0.6));

  // ---------- Floor: concrete slab, screed and parquet, as the section shows them ----------
  const fx = (x0 + x1) / 2, fz = (z0 + z1) / 2, fw = x1 - x0, fd = z1 - z0;
  block(fw, F - 0.08, fd, M.concrete, fx, (F - 0.08) / 2, fz, world);
  block(fw, 0.06, fd, M.screed, fx, F - 0.05, fz, world);
  block(fw, 0.02, fd, [M.woodEdge, M.woodEdge, M.floor, M.woodEdge, M.woodEdge, M.woodEdge], fx, F - 0.01, fz, world);

  // ---------- Walls with their window and door ----------
  layeredWall(world, M, { along: "x", inner: z0, outer: z0 - t, a: x0 - t, b: x1, y0: 0, y1: F + H, openings: [win] });
  layeredWall(world, M, { along: "z", inner: x0, outer: x0 - t, a: z0, b: z1, y0: 0, y1: F + H, openings: [door] });
  windowUnit(world, M, win, z0, z0 - t);
  doorUnit(world, M, door, x0, x0 - t);
  radiator(world, M, win.a + 0.08, win.b - 0.1, F + 0.13, F + 0.73, z0, F);
  curtain(world, M, -1.68, -1.32, F + 2.44, F + 0.02, z0 + 0.09, win.b + 0.05);

  // ---------- Skirting boards (broken by the door), switch and sockets ----------
  const sk = (len, x, z, alongX) => block(alongX ? len : 0.015, 0.06, alongX ? 0.015 : len, M.trim, x, F + 0.03, z, world);
  sk(x1 - x0, (x0 + x1) / 2, z0 + 0.008, true);
  const d0 = door.a + 0.025 - 0.065, d1 = door.b - 0.025 + 0.065;
  sk(d0 - z0, x0 + 0.008, (z0 + d0) / 2, false); sk(z1 - d1, x0 + 0.008, (d1 + z1) / 2, false);
  block(0.012, 0.082, 0.082, M.trim, x0 + 0.006, F + 1.05, d1 + 0.07, world); // light switch by the door
  block(0.004, 0.024, 0.012, M.radGrille, x0 + 0.014, F + 1.05, d1 + 0.07, world);
  for (const [x, z, alongX] of [[-4.32, z0, true], [x0, 0.3, false]]) {
    if (alongX) block(0.075, 0.075, 0.012, M.trim, x, F + 0.3, z + 0.006, world);
    else block(0.012, 0.075, 0.075, M.trim, x + 0.006, F + 0.3, z, world);
  }

  mergeStatic(world);
  return { world, M };
}
