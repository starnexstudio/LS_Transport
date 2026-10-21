// Master timeline for the hero, t from 0 (furnished house) to 1 (truck gone).
// Everything is a pure function of t, so any scroll position maps to one exact
// state and scrolling back plays it in reverse.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { model } from "./assets.js";
import { HOUSE, contactShadow } from "./world.js";
import { T } from "./truck.js";
import { planLoad } from "./pack.js";
import { mergeStatic } from "./merge.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const clamp01 = (u) => Math.min(1, Math.max(0, u));
const ease = (u) => u * u * (3 - 2 * u);
const span = (t, a, b) => clamp01((t - a) / (b - a));
const qYaw = (a) => new THREE.Quaternion().setFromAxisAngle(UP, a);

const { F0, F1, C0, C1 } = HOUSE;
const B = 0.34; // stacked box height
const Q = Math.PI / 2;
const BOX = "box"; // procedural moving box (see cardboardBox)

// Household contents: where each piece stands at home. `on` names the piece it
// stands on (its height then follows from that piece); otherwise `y` is the floor
// or base height. Packed boxes: "openbox:<contents>". The loading order comes from
// the packing plan (large pieces first, front of the cargo first).
const item = (key, m, x, z, o = {}) => ({ key, m, x, z, y: o.y ?? F0, r: o.r ?? 0, on: o.on, f: o.f ?? "" });
const boxes = (prefix, x, z, y, n, top) => Array.from({ length: n }, (_, i) =>
  item(`${prefix}${i}`, i === n - 1 && top ? `openbox:${top}` : BOX, x, z, { y: y + i * B, r: ((i * 7) % 5 - 2) * 0.03, f: i === n - 1 && top ? "stack" : "stack support" }));
const CONTENTS = [
  // Ground floor, living room
  item("sofa", "Sofa_01", -3.4, -4.77, { f: "support" }),
  item("pillows", "throw_pillows_01", -3.4, -4.74, { y: F0 + 0.38, on: "sofa", f: "stack" }),
  item("coffeetable", "modern_coffee_table_01", -3.4, -3.55, { r: Q, f: "stack support" }),
  item("vase1", "ceramic_vase_04", -3.15, -3.55, { on: "coffeetable", f: "stack" }),
  item("bowl1", "wooden_bowl_01", -3.68, -3.5, { on: "coffeetable", f: "stack" }),
  item("armchair", "modern_arm_chair_01", -4.75, -3.4, { r: Q }),
  item("lounge", "mid_century_lounge_chair", -2.2, -3.6, { r: -Q + 0.45 }),
  item("ottoman", "Ottoman_01", -2.7, -2.5, { r: 0.3, f: "stack" }),
  item("sideboard", "modern_wooden_cabinet", -1.64, -1.3, { r: -Q, f: "support" }),
  item("tv", "Television_01", -1.64, -1.5, { r: -Q, on: "sideboard", f: "stack" }),
  item("vase2", "ceramic_vase_03", -1.64, -0.4, { on: "sideboard", f: "stack" }),
  item("frame1", "standing_picture_frame_01", -1.64, -2.2, { r: -Q - 0.3, on: "sideboard", f: "stack" }),
  item("shelf", "wooden_display_shelves_01", -5.23, -1.6, { f: "support" }),
  item("books1", "books", -5.23, -1.62, { r: Q, on: "shelf", f: "stack" }),
  item("talltable", "side_table_tall_01", -4.85, -4.72, { f: "stack support" }),
  item("vase3", "ceramic_vase_02", -4.85, -4.72, { on: "talltable", f: "stack" }),
  item("bigplant", "potted_plant_02", -1.95, 0.35, { r: 0.3, f: "stack" }),
  item("pic1", "hanging_picture_frame_02", -5.42, -1.6, { y: F0 + 1.88, r: Q, f: "stack" }),
  item("pic2", "hanging_picture_frame_01", -5.42, -3.5, { y: F0 + 1.25, r: Q, f: "stack" }),
  ...boxes("lbox", -4.85, 0.4, F0, 2),
  item("lopen", "openbox:decor", -4.25, 0.5, { r: 0.25, f: "stack" }),
  // Ground floor, dining room
  item("table", "wooden_table_02", -7.6, -2.0, { f: "support" }),
  item("bowl2", "wooden_bowl_01", -7.6, -2.0, { on: "table", f: "stack" }),
  item("chair1", "painted_wooden_chair_01", -7.35, -1.25, { r: Math.PI, f: "stack" }),
  item("chair2", "painted_wooden_chair_01", -7.85, -2.75, { f: "stack" }),
  item("chair3", "painted_wooden_chair_01", -8.5, -2.0, { r: Q, f: "stack" }),
  item("chair4", "painted_wooden_chair_01", -6.7, -2.0, { r: -Q, f: "stack" }),
  item("commode", "GothicCommode_01", -5.87, -3.1, { r: -Q, f: "support" }),
  item("vase4", "antique_ceramic_vase_01", -5.87, -3.4, { on: "commode", f: "stack" }),
  item("clock1", "alarm_clock_01", -5.87, -2.72, { r: -Q, on: "commode", f: "stack" }),
  item("pic3", "hanging_picture_frame_01", -5.58, -3.1, { y: F0 + 1.75, r: -Q, f: "stack" }),
  item("sidetable", "side_table_01", -9.2, 0.3, { r: 0.2, f: "stack support" }),
  item("smallplant", "potted_plant_04", -9.2, 0.3, { r: 0.4, on: "sidetable", f: "stack" }),
  item("dopen", "openbox:kitchen", -6.3, 0.45, { r: -0.2, f: "stack" }),
  // Upstairs, bedroom
  item("bed", "old_bed_frame", -3.0, -4.1, { y: F1 }),
  item("nightstand", "ClassicNightstand_01", -1.95, -4.85, { y: F1, f: "stack support" }),
  item("desklamp", "desk_lamp_arm_01", -1.95, -4.85, { r: -0.6, on: "nightstand", f: "stack" }),
  item("drawers", "drawer_cabinet", -1.63, -2.2, { y: F1, r: -Q, f: "support" }),
  item("frame2", "standing_picture_frame_02", -1.63, -2.55, { r: -Q + 0.3, on: "drawers", f: "stack" }),
  item("vase5", "ceramic_vase_03", -1.63, -1.8, { on: "drawers", f: "stack" }),
  item("cabinet", "painted_wooden_cabinet", -5.13, -3.3, { y: F1, r: Q, f: "support" }),
  item("basket1", "wicker_basket_02", -5.13, -3.3, { r: 0.4, on: "cabinet", f: "stack" }),
  item("mirror", "ornate_mirror_01", -5.4, -1.6, { y: F1, r: Q }),
  item("rocking", "Rockingchair_01", -2.1, -0.4, { y: F1, r: -2.3 }),
  item("suitcases", "vintage_suitcase", -4.0, 0.2, { y: F1, r: 0.15 }),
  // Upstairs, storage room
  ...boxes("sa", -8.6, -0.6, F1, 3, "books"),
  ...boxes("sb", -8.0, -0.4, F1, 3),
  ...boxes("sc", -7.3, -1.1, F1, 2, "decor"),
  ...boxes("sd", -6.4, 0.3, F1, 2),
  item("steelshelf", "steel_frame_shelves_01", -5.83, -2.2, { y: F1, r: -Q, f: "support" }),
  item("books2", "books", -5.83, -2.2, { r: Q, on: "steelshelf", f: "stack" }),
  item("bookshelf", "wooden_bookshelf_worn", -9.33, -2.6, { y: F1, r: Q, f: "support" }),
  item("books3", "books", -9.33, -2.9, { r: Q, on: "bookshelf", f: "stack" }),
  item("oldtv", "television_02", -7.0, -3.2, { y: F1, r: 0.5, f: "stack support" }),
  item("woodchair", "painted_wooden_chair_01", -6.6, -1.6, { y: F1, r: -0.4, f: "stack" }),
  // Packed and waiting in the front garden
  ...boxes("ya", -9.2, 2.5, 0, 3, "books"),
  ...boxes("yb", -8.5, 2.3, 0, 2, "kitchen"),
  ...boxes("yc", -7.8, 2.75, 0, 2),
  item("yopen", "openbox:decor", -8.95, 3.35, { y: 0, r: 0.5, f: "stack" }),
  ...boxes("yd", -8.2, 3.5, 0, 1),
];
// What goes into the open boxes (on top of crumpled paper).
const PACKED = {
  books: [["books", -0.09, 0.13, 0, Q, 0.92], ["books", 0.09, 0.15, 0, Q + 0.05, 0.92]],
  kitchen: [["wooden_bowl_01", 0.0, 0.25, 0.06, 0.4, 1], ["ceramic_vase_03", -0.11, 0.06, -0.16, 0, 1], ["ceramic_vase_04", 0.1, 0.1, -0.12, 0, 0.9]],
  decor: [["standing_picture_frame_02", -0.08, 0.16, 0.1, 0.2, 1], ["alarm_clock_01", 0.1, 0.24, -0.1, -0.5, 1], ["ceramic_vase_02", 0.07, 0.12, 0.12, 0, 0.9]],
};

// Timeline (fractions of the scroll)
export const TL = { fly0: 0.0, fly1: 0.72, flight: 0.12, cleared: 0.73, door: [0.77, 0.835], lift: [0.83, 0.885], rev: [0.885, 0.95], drive: [0.952, 1.0] };

// Moving box: one mesh, a cardboard texture with packing tape over the top and ends.
let boxMat = null;
function cardboardBox() {
  if (!boxMat) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#b8894f"; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2500; i++) { const v = 150 + ((i * 97) % 60); g.fillStyle = `rgba(${v},${v * 0.72},${v * 0.42},0.18)`; g.fillRect((i * 53) % 256, (i * 31) % 256, 2, 1); }
    for (let y = 0; y < 256; y += 6) { g.fillStyle = "rgba(90,60,30,0.05)"; g.fillRect(0, y, 256, 2); } // corrugation
    g.fillStyle = "#cfae78"; g.fillRect(108, 0, 40, 256); g.fillStyle = "rgba(255,255,255,0.18)"; g.fillRect(112, 0, 6, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    boxMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.82 });
  }
  const geo = new THREE.BoxGeometry(0.39, 0.34, 0.52), uv = geo.attributes.uv;
  // Sides (±x) and bottom use the strip left of the tape; top and ends carry the tape.
  for (const f of [0, 1, 3]) for (let v = 0; v < 4; v++) uv.setX(f * 4 + v, uv.getX(f * 4 + v) * 0.38);
  const m = new THREE.Mesh(geo, boxMat); m.position.y = 0.17; m.castShadow = m.receiveShadow = true;
  const wrap = new THREE.Group(); wrap.add(m); wrap.userData.size = V(0.39, 0.34, 0.52);
  return wrap;
}

// A row of books in one mesh (vertex colours), about the size of a shelf's worth.
const SPINES = ["#7a2430", "#23395d", "#2f5d4a", "#6b4a2b", "#d8cfb8", "#3c3c46", "#8a6a2a", "#9a3b2e"];
function bookRow(seed = 1) {
  const parts = []; let x = 0;
  for (let i = 0; x < 0.5; i++) {
    const r = (k) => ((Math.sin((i + 1) * 12.9898 * seed + k * 78.233) * 43758.5453) % 1 + 1) % 1;
    const w = 0.026 + r(1) * 0.03, h = 0.18 + r(2) * 0.06, d = 0.14 + r(3) * 0.03;
    const g = new THREE.BoxGeometry(w, h, d).toNonIndexed(); g.translate(x + w / 2, h / 2, 0);
    const col = new THREE.Color(SPINES[Math.floor(r(4) * SPINES.length)]), cols = [];
    for (let v = 0; v < g.attributes.position.count; v++) cols.push(col.r, col.g, col.b);
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3)); g.deleteAttribute("uv");
    parts.push(g); x += w + 0.002;
  }
  const geo = mergeGeometries(parts); geo.translate(-x / 2, 0, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 }));
  m.castShadow = m.receiveShadow = true;
  const wrap = new THREE.Group(); wrap.add(m); wrap.userData.size = V(x, 0.24, 0.17);
  return wrap;
}

// A cardboard box with its flaps open, filled with crumpled paper and things.
function openBox(models, contents, size) {
  const g = new THREE.Group();
  const card = new THREE.MeshStandardMaterial({ color: "#b98b58", roughness: 0.88 });
  const inside = new THREE.MeshStandardMaterial({ color: "#9a7044", roughness: 0.92 });
  const { x: w, y: h, z: d } = size, t = 0.008;
  const wall = (sx, sy, sz, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), [card, card, card, inside, card, card]); m.position.set(x, y, z); g.add(m); return m; };
  wall(w, t, d, 0, t / 2, 0);
  for (const s of [-1, 1]) { wall(t, h, d, s * (w / 2 - t / 2), h / 2, 0); wall(w, h, t, 0, h / 2, s * (d / 2 - t / 2)); }
  // Flaps hinged on the top edges, folded out and down
  for (const s of [-1, 1]) {
    const a = new THREE.Group(); a.position.set(s * w / 2, h, 0); a.rotation.z = s * -2.2; g.add(a);
    const fa = new THREE.Mesh(new THREE.BoxGeometry(t, w * 0.48, d * 0.98), card); fa.position.y = w * 0.24; a.add(fa);
    const b = new THREE.Group(); b.position.set(0, h, s * d / 2); b.rotation.x = s * 2.1; g.add(b);
    const fb = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, w * 0.42, t), card); fb.position.y = w * 0.21; b.add(fb);
  }
  // Crumpled paper
  const paper = new THREE.MeshStandardMaterial({ color: "#f1eee6", roughness: 0.95, flatShading: true });
  for (let i = 0; i < 7; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.06, 0), paper);
    p.position.set(((i * 37) % 7 / 7 - 0.43) * w * 0.8, h - 0.05 + (i % 3) * 0.015, ((i * 53) % 9 / 9 - 0.45) * d * 0.8);
    p.rotation.set(i, i * 2.1, i * 0.7); p.scale.set(1, 0.7 + (i % 3) * 0.15, 1.1); g.add(p);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  mergeStatic(g);
  contents.forEach(([id, x, y, z, r, s], i) => {
    const m = id === "books" ? bookRow(i + 3) : models[id].clone(); m.position.set(x, y, z); m.rotation.y = r; m.scale.setScalar(s); g.add(m);
  });
  const wrap = new THREE.Group(); wrap.add(g);
  wrap.userData.size = V(w, h + 0.06, d);
  return wrap;
}

// Camera keys joined by a cubic Hermite spline (Catmull–Rom tangents for uneven key
// spacing, at rest at both ends): the camera never stops and restarts between keys.
const m1v = V(0, 0, 0), m2v = V(0, 0, 0);
function spline(keys, t, prop, out) {
  if (t <= keys[0].t) return out.copy(keys[0][prop]);
  if (t >= keys.at(-1).t) return out.copy(keys.at(-1)[prop]);
  let i = 1; while (keys[i].t < t) i++;
  const k1 = keys[i - 1], k2 = keys[i], k0 = keys[i - 2], k3 = keys[i + 1];
  const h = k2.t - k1.t, u = (t - k1.t) / h, u2 = u * u, u3 = u2 * u;
  const tangent = (a, b, m) => (a && b ? m.subVectors(b[prop], a[prop]).multiplyScalar(0.85 / (b.t - a.t)) : m.set(0, 0, 0));
  tangent(k0, k2, m1v); tangent(k1, k3, m2v);
  return out.copy(k1[prop]).multiplyScalar(2 * u3 - 3 * u2 + 1)
    .addScaledVector(m1v, (u3 - 2 * u2 + u) * h).addScaledVector(k2[prop], -2 * u3 + 3 * u2).addScaledVector(m2v, (u3 - u2) * h);
}

export async function buildSequence({ scene, truck, mobile }) {
  // ---------- Items ----------
  const procedural = new Set([BOX, "books"]), ids = new Set();
  for (const c of CONTENTS) if (!c.m.startsWith("openbox") && !procedural.has(c.m)) ids.add(c.m);
  for (const list of Object.values(PACKED)) for (const [id] of list) if (!procedural.has(id)) ids.add(id);
  const models = Object.fromEntries(await Promise.all([...ids].map(async (id) => [id, await model(id, { texSize: mobile ? 256 : 512 })])));
  const used = new Set();
  const byKey = new Map();
  const items = CONTENTS.map((c) => {
    let src;
    if (c.m.startsWith("openbox:")) src = openBox(models, PACKED[c.m.split(":")[1]], V(0.39, 0.34, 0.52));
    else if (c.m === BOX) src = cardboardBox();
    else if (c.m === "books") src = bookRow(c.key.length + c.x);
    else { src = used.has(c.m) ? models[c.m].clone() : models[c.m]; used.add(c.m); }
    const size = src.userData.size;
    // Holder with its origin at the item's centre, so it turns about its middle in flight.
    const o = new THREE.Group(); o.name = c.key;
    src.position.y = -size.y / 2; o.add(src); scene.add(o);
    // Tiny pieces and the leafy plant skip the shadow pass (cost, little gain).
    if (Math.max(size.x, size.y, size.z) < 0.35 || c.m.startsWith("potted_plant")) o.traverse((m) => { if (m.isMesh) m.castShadow = false; });
    const it = { key: c.key, o, size, c, stack: c.f.includes("stack"), support: c.f.includes("support"), below: c.on };
    byKey.set(c.key, it);
    return it;
  });
  // Home poses; pieces standing on others take their height from them.
  const baseOf = (it) => (it.c.on ? baseOf(byKey.get(it.c.on)) + byKey.get(it.c.on).size.y : it.c.y);
  for (const it of items) {
    const base = baseOf(it);
    it.home = { pos: V(it.c.x, base + it.size.y / 2, it.c.z), quat: qYaw(it.c.r) };
    it.ceiling = it.c.z > HOUSE.z1 ? Infinity : base < F1 - 0.01 ? C0 : C1;
    if (!it.below) { // stacked boxes: what's directly underneath
      it.below = items.find((o) => o !== it && !o.c.on && Math.hypot(o.c.x - it.c.x, o.c.z - it.c.z) < 0.1 && Math.abs(baseOf(o) + o.size.y - base) < 0.03)?.key;
    }
  }

  // ---------- Packing plan and loading order ----------
  const C = T.cargo, space = { w: 2 * C.x - 0.04, l: C.z1 - C.z0 - 0.04, h: C.y1 - C.y0 };
  const plan = planLoad(items.map((it) => ({ key: it.key, w: it.size.x, d: it.size.z, h: it.size.y, stack: it.stack, support: it.support, below: it.below })), space);
  const slots = plan.slots;
  items.sort((a, b) => plan.order.indexOf(a.key) - plan.order.indexOf(b.key));
  for (const it of items) {
    const s = slots[it.key] ?? { x: 0, z: space.l - 0.5, y: 0, rot: 0 };
    it.slot = { pos: V(s.x, C.y0 + s.y + it.size.y / 2 + 0.002, C.z1 - 0.02 - s.z), quat: qYaw(s.rot ? Q : 0) };
  }

  // ---------- Truck: parked nose-first in the drive, rear and tail lift to the street ----------
  const parked = { pos: V(-13.0, 0, -0.5), yaw: Math.PI };
  truck.root.position.copy(parked.pos); truck.root.rotation.y = parked.yaw; scene.add(truck.root);
  truck.root.add(contactShadow(2.7, 9.9, 0, 1.65, 0.55)); // travels with the truck
  truck.root.updateMatrixWorld(true);
  const toWorld = (p) => truck.root.localToWorld(p.clone());

  // ---------- Flight paths (world, truck parked) ----------
  const n = items.length, stagger = (TL.fly1 - TL.fly0 - TL.flight) / (n - 1);
  items.forEach((it, i) => {
    it.t0 = TL.fly0 + i * stagger;
    const p0 = it.home.pos, h = it.size.y;
    const upstairs = it.ceiling === C1; // leaves under the eaves and gutter
    const rise = Math.max(0.2, Math.min(upstairs ? 0.5 : 1.25, it.ceiling - (p0.y + h / 2) - 0.12));
    const p4 = toWorld(it.slot.pos);
    const p3 = toWorld(V(it.slot.pos.x, it.slot.pos.y + 0.2, T.rear - 1.5));
    // Through the middle of the rear opening, then straight along the cargo space.
    const pIn = it.slot.pos.z > T.rear + 0.7 ? toWorld(V(it.slot.pos.x, it.slot.pos.y + 0.06, T.rear + 0.25)) : null;
    const p1 = p0.clone().add(V(0, rise, 0.25));
    const p2 = V(THREE.MathUtils.lerp(p0.x, p3.x, 0.35), upstairs ? p1.y : Math.max(p1.y, p3.y) + 0.6, Math.max(HOUSE.z1 + 1.9, p0.z + 0.6));
    it.curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, ...(pIn ? [pIn] : []), p4], false, "centripetal");
    it.curve.arcLengthDivisions = 400;
    it.curve.getLength();
    it.p3 = p3; it.p4 = p4;
    it.roll = (i % 2 ? 1 : -1) * 0.06;
  });

  // ---------- Departure: reverse out in a quarter turn, then drive off along the street ----------
  const R = 6.5, laneZ = 9.7, ZR = laneZ - R;
  const straight = ZR - parked.pos.z, arc = (Math.PI / 2) * R, REV = straight + arc, FWD = 60;
  const wheelbase = T.frontAxle, steerMax = -Math.atan(wheelbase / R);
  function truckPose(t) {
    const rev = ease(span(t, ...TL.rev)) * REV;
    const uf = span(t, ...TL.drive), ahead = FWD * uf * uf;
    if (ahead > 0) return { pos: V(parked.pos.x + R - ahead, 0, laneZ), yaw: -Q, dist: ahead - REV, steer: 0 };
    if (rev <= straight) return { pos: V(parked.pos.x, 0, parked.pos.z + rev), yaw: Math.PI, dist: -rev, steer: steerMax * clamp01((rev - straight + 0.8) / 0.8) };
    const a = (rev - straight) / R;
    return { pos: V(parked.pos.x + R - R * Math.cos(a), 0, ZR + R * Math.sin(a)), yaw: Math.PI + a, dist: -rev, steer: steerMax * clamp01((Q - a) / 0.25) };
  }

  // ---------- Camera ----------
  // A slow, continuous dolly like a filmed shot: the full house and the truck, easing
  // in as the rooms empty, over to the truck as its doors close, then back out as it
  // leaves. The keys are composed for a 30° lens on a band 1.8 times as wide as it is
  // tall (main.js frames that band between the copy and the actions); on any other
  // band the camera backs off along its line of sight until the same view fits.
  const REF = { aspect: 1.8, halfTan: Math.tan(THREE.MathUtils.degToRad(15)) };
  const camKeys = [
    { t: 0, pos: V(-9.0, 6.9, 22.5), look: V(-6.6, 3.2, -0.8) },
    { t: 0.36, pos: V(-8.4, 6.7, 21.8), look: V(-6.5, 3.1, -0.9) },
    { t: 0.72, pos: V(-7.7, 6.6, 21.4), look: V(-6.4, 3.2, -1.0) },
    { t: 0.78, pos: V(-7.9, 6.4, 21.2), look: V(-7.4, 3.2, -0.4) },
    { t: 0.845, pos: V(-10.6, 6.1, 21.1), look: V(-10.0, 3.3, 0.5) },
    // Back out before the truck reverses towards us, and stay back while it drives
    // off, so it never leaves the band at the bottom.
    { t: 0.95, pos: V(-8.0, 8.3, 34.0), look: V(-7.5, 2.4, 3.0) },
    { t: 0.975, pos: V(-8.2, 8.2, 32.6), look: V(-7.3, 2.5, 2.4) },
    { t: 1, pos: V(-7.5, 7.9, 26.3), look: V(-6.0, 3.0, 0.3) },
  ];


  const tmpQ = new THREE.Quaternion(), wob = new THREE.Quaternion(), tan = V(0, 0, 0), side = V(0, 0, 0), look = V(0, 0, 0);
  function evaluate(t, camera) {
    // Truck
    const tp = truckPose(t);
    truck.root.position.copy(tp.pos); truck.root.rotation.set(0, tp.yaw, 0);
    truck.setWheels(tp.dist, tp.steer);
    truck.setDoor(ease(span(t, ...TL.door)));
    truck.setLift(span(t, ...TL.lift));
    truck.root.updateMatrixWorld(true);
    const truckQ = truck.root.quaternion;

    // Items
    for (const it of items) {
      const u = clamp01((t - it.t0) / TL.flight), o = it.o;
      if (u >= 1) { o.position.copy(toWorld(it.slot.pos)); o.quaternion.copy(truckQ).multiply(it.slot.quat); continue; }
      if (u <= 0) { o.position.copy(it.home.pos); o.quaternion.copy(it.home.quat); continue; }
      // Lift off gently, glide out and over, ease into its place in the cargo.
      // One smooth path, gentle sine ease in and out.
      const e = 0.5 - 0.5 * Math.cos(Math.PI * u);
      o.position.copy(it.curve.getPointAt(e)); it.curve.getTangentAt(e, tan);
      const qe = ease(clamp01((e - 0.05) / 0.8));
      o.quaternion.slerpQuaternions(it.home.quat, tmpQ.copy(truckQ).multiply(it.slot.quat), qe);
      side.set(tan.z, 0, -tan.x).normalize();
      o.quaternion.premultiply(wob.setFromAxisAngle(side, it.roll * Math.sin(Math.PI * clamp01(e / 0.85))));
    }

    // Camera
    spline(camKeys, t, "pos", camera.position); spline(camKeys, t, "look", look);
    const fit = (REF.halfTan / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * Math.max(1, REF.aspect / camera.aspect);
    camera.position.sub(look).multiplyScalar(fit).add(look);
    camera.lookAt(look);
    return { cleared: t >= TL.cleared };
  }

  return { evaluate, items, slots, plan };
}
