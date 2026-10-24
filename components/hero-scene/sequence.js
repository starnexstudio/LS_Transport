// Master timeline for the hero, t from 0 (room packed full) to 1 (empty room, van gone).
// Everything is a pure function of t, so any scroll position maps to one exact
// state and scrolling back plays it in reverse.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { model } from "./assets.js";
import { ROOM, contactShadow } from "./world.js";
import { T } from "./truck.js";
import { planLoad } from "./pack.js";
import { mergeStatic } from "./merge.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const clamp01 = (u) => Math.min(1, Math.max(0, u));
const ease = (u) => u * u * (3 - 2 * u);
const span = (t, a, b) => clamp01((t - a) / (b - a));
const qYaw = (a) => new THREE.Quaternion().setFromAxisAngle(UP, a);

const { F } = ROOM;
const B = 0.34; // stacked box height
const Q = Math.PI / 2;
const BOX = "box", RUG = "rug"; // procedural moving box and rolled rug (see cardboardBox, rugRoll)

// The room's contents, packed and ready to go: where each piece stands. `on` names
// the piece it stands on (its height then follows from that piece); otherwise `y`
// is its base height. Packed boxes: "openbox:<contents>". The loading order comes
// from the packing plan (large pieces first, front of the cargo first).
const item = (key, m, x, z, o = {}) => ({ key, m, x, z, y: o.y ?? F, r: o.r ?? 0, on: o.on, f: o.f ?? "" });
const boxes = (prefix, x, z, n, top) => Array.from({ length: n }, (_, i) =>
  item(`${prefix}${i}`, i === n - 1 && top ? `openbox:${top}` : BOX, x, z, { y: F + i * B, r: ((i * 7) % 5 - 2) * 0.03, f: i === n - 1 && top ? "stack" : "stack support" }));
const CONTENTS = [
  // Along the back wall
  item("bookshelf", "wooden_bookshelf_worn", -5.15, -3.88, { f: "support" }),
  item("books1", "books", -5.15, -3.9, { on: "bookshelf", f: "stack" }),
  item("rug", RUG, -4.32, -3.9),
  item("sideboard", "modern_wooden_cabinet", -2.95, -3.91, { f: "support" }),
  item("tv", "Television_01", -3.6, -3.93, { on: "sideboard", f: "stack" }),
  item("frame1", "standing_picture_frame_01", -2.75, -3.95, { r: 0.3, on: "sideboard", f: "stack" }),
  item("vase2", "ceramic_vase_03", -2.2, -3.93, { on: "sideboard", f: "stack" }),
  item("pic1", "hanging_picture_frame_02", -2.95, -4.18, { y: F + 1.3, r: Math.PI, f: "stack" }),
  item("bigplant", "potted_plant_02", -0.4, -3.2, { r: 0.3, f: "stack" }),
  item("talltable", "side_table_tall_01", -4.25, -3.15, { f: "stack support" }),
  item("vase3", "ceramic_vase_02", -4.25, -3.15, { on: "talltable", f: "stack" }),
  // Along the left wall, either side of the door
  item("steelshelf", "steel_frame_shelves_01", -5.72, -1.83, { r: Q, f: "support" }),
  item("books2", "books", -5.72, -1.83, { r: Q, on: "steelshelf", f: "stack" }),
  item("commode", "GothicCommode_01", -5.68, -0.7, { r: Q, f: "support" }),
  item("vase4", "antique_ceramic_vase_01", -5.68, -1.0, { on: "commode", f: "stack" }),
  item("basket1", "wicker_basket_02", -5.68, -0.62, { r: Q + 0.2, on: "commode", f: "stack" }),
  item("clock1", "alarm_clock_01", -5.68, -0.28, { r: Q, on: "commode", f: "stack" }),
  item("pic2", "hanging_picture_frame_01", -5.985, -0.7, { y: F + 1.4, r: Q, f: "stack" }),
  // Seating
  item("sofa", "Sofa_01", -3.2, -2.55, { f: "support" }),
  item("pillows", "throw_pillows_01", -3.2, -2.52, { on: "sofa", f: "stack" }),
  item("coffeetable", "modern_coffee_table_01", -3.2, -1.5, { r: Q, f: "stack support" }),
  item("bowl1", "wooden_bowl_01", -3.45, -1.5, { on: "coffeetable", f: "stack" }),
  item("vase1", "ceramic_vase_04", -2.9, -1.5, { on: "coffeetable", f: "stack" }),
  item("armchair", "modern_arm_chair_01", -4.68, -2.0, { r: 0.7 }),
  item("lounge", "mid_century_lounge_chair", -1.55, -2.3, { r: -0.55 }),
  item("ottoman", "Ottoman_01", -2.05, -0.95, { r: 0.25, f: "stack support" }),
  item("oopen", "openbox:decor", -2.05, -0.95, { r: -0.2, on: "ottoman", f: "stack" }),
  // Dining table at the front, cleared into a box
  item("table", "wooden_table_02", -4.3, -0.5, { f: "support" }),
  item("topen", "openbox:kitchen", -4.55, -0.5, { r: 0.15, on: "table", f: "stack" }),
  item("bowl2", "wooden_bowl_01", -3.95, -0.45, { on: "table", f: "stack" }),
  item("chair1", "painted_wooden_chair_01", -4.3, 0.15, { r: Math.PI, f: "stack" }),
  item("chair2", "painted_wooden_chair_01", -5.0, -0.5, { r: Q, f: "stack" }),
  item("suitcases", "vintage_suitcase", -3.1, 0.35, { r: 0.05 }),
  // Packed boxes, labelled by room, stacked by the open side, ready to go
  ...boxes("ra", -0.5, 0.2, 3),
  ...boxes("rb", -0.5, -0.4, 3, "books"),
  ...boxes("rc", -1.0, 0.25, 2),
  ...boxes("rd", -1.0, -0.35, 3),
  ...boxes("re", -0.5, -1.0, 2, "kitchen"),
  ...boxes("rf", -1.5, 0.3, 2),
  ...boxes("rg", -0.5, -1.6, 2),
  ...boxes("lc", -1.95, 0.3, 2),
  ...boxes("la", -5.55, 0.3, 3, "decor"),
];
// What each stack of boxes says on its sides, in marker; `glass` adds a fragile sticker.
const LABELS = {
  ra: { text: "Küche" }, rb: { text: "Bücher" }, rc: { text: "Bad" }, rd: { text: "Wohnzimmer" },
  re: { text: "Geschirr", glass: true }, rf: { text: "Schlafzimmer" }, rg: { text: "Kinderzimmer" },
  lc: { text: "Deko", glass: true }, la: { text: "Bücher" },
};
// What goes into the open boxes (on top of crumpled paper).
const PACKED = {
  books: [["books", -0.09, 0.13, 0, Q, 0.92], ["books", 0.09, 0.15, 0, Q + 0.05, 0.92]],
  kitchen: [["wooden_bowl_01", 0.0, 0.25, 0.06, 0.4, 1], ["ceramic_vase_03", -0.11, 0.06, -0.16, 0, 1], ["ceramic_vase_04", 0.1, 0.1, -0.12, 0, 0.9]],
  decor: [["standing_picture_frame_02", -0.08, 0.16, 0.1, 0.2, 1], ["alarm_clock_01", 0.1, 0.24, -0.1, -0.5, 1], ["ceramic_vase_02", 0.07, 0.12, 0.12, 0, 0.9]],
};

// Timeline (fractions of the scroll)
export const TL = { fly0: 0.0, fly1: 0.72, flight: 0.12, cleared: 0.73, door: [0.77, 0.835], lift: [0.83, 0.885], drive: [0.89, 1.0] };

// Moving box: one mesh with its own texture atlas: corrugated kraft board, the lid
// seam taped over and the tape running down the ends, hand holes, printed arrows
// and the room written on the sides in marker (plus a fragile sticker on some).
const BOX_SIZE = V(0.39, 0.34, 0.52);
const boxMats = new Map();
let boxBoard = null;
function boxMaterial({ text = "", glass = false } = {}) {
  const k = text + glass;
  if (boxMats.has(k)) return boxMats.get(k);
  const S = 512, c = document.createElement("canvas"); c.width = c.height = S;
  let g = c.getContext("2d");
  const R = { side: [0, 0, 256, 168], end: [256, 0, 192, 168], top: [0, 176, 192, 256], bottom: [256, 176, 192, 256] };
  const kraft = (x, y, w, h, flutes) => {
    g.fillStyle = "#b98a51"; g.fillRect(x, y, w, h);
    for (let i = 0; i < w * h / 30; i++) { const v = 150 + ((i * 97) % 70); g.fillStyle = `rgba(${v},${v * 0.72},${v * 0.42},0.16)`; g.fillRect(x + (i * 53) % w, y + (i * 31) % h, 2, 1); }
    g.fillStyle = "rgba(80,52,25,0.045)";
    for (let p = 0; p < (flutes ? w : h); p += 5) flutes ? g.fillRect(x + p, y, 2, h) : g.fillRect(x, y + p, w, 2);
    const e = g.createLinearGradient(x, y, x, y + h); // scuffed, darker edges
    e.addColorStop(0, "rgba(70,45,20,0.18)"); e.addColorStop(0.08, "rgba(70,45,20,0)"); e.addColorStop(0.92, "rgba(70,45,20,0)"); e.addColorStop(1, "rgba(70,45,20,0.2)");
    g.fillStyle = e; g.fillRect(x, y, w, h);
  };
  const tape = (x, y, w, h) => {
    g.fillStyle = "rgba(205,165,105,0.82)"; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(255,255,255,0.22)"; g.fillRect(x + w * 0.18, y, w * 0.12, h);
    g.fillStyle = "rgba(90,60,25,0.25)"; g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h);
  };
  // The board itself is the same on every box: drawn once, then copied.
  if (!boxBoard) {
    boxBoard = document.createElement("canvas"); boxBoard.width = boxBoard.height = S;
    const own = g; g = boxBoard.getContext("2d");
    for (const [name, [x, y, w, h]] of Object.entries(R)) kraft(x, y, w, h, name !== "top" && name !== "bottom");
    g = own;
  }
  g.drawImage(boxBoard, 0, 0);
  // Lid: the flaps meet along the middle, taped over
  { const [x, y, w, h] = R.top; g.fillStyle = "rgba(60,38,16,0.55)"; g.fillRect(x + w / 2 - 1, y, 2, h); tape(x + w / 2 - 13, y, 26, h); }
  // Ends: tape down from the lid, a hand hole below it
  { const [x, y, w, h] = R.end; tape(x + w / 2 - 13, y, 26, h * 0.24);
    g.fillStyle = "#2a1c0e"; g.beginPath(); g.roundRect(x + w / 2 - 24, y + h * 0.36, 48, 13, 6.5); g.fill(); }
  // Sides: printed arrows, the room in marker, a fragile sticker
  { const [x, y, w, h] = R.side;
    g.strokeStyle = "rgba(30,30,30,0.75)"; g.fillStyle = "rgba(30,30,30,0.75)"; g.lineWidth = 2.5;
    for (const ax of [x + 18, x + 30]) { g.beginPath(); g.moveTo(ax, y + 34); g.lineTo(ax, y + 16); g.stroke(); g.beginPath(); g.moveTo(ax - 5, y + 20); g.lineTo(ax, y + 12); g.lineTo(ax + 5, y + 20); g.fill(); }
    if (text) {
      g.save(); g.translate(x + w * 0.54, y + h * 0.55); g.rotate(-0.06);
      g.font = `700 ${text.length > 9 ? 27 : 34}px "Segoe Print", "Bradley Hand", "Comic Sans MS", cursive`;
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "rgba(18,18,22,0.88)"; g.fillText(text, 0, 0);
      g.restore();
    }
    if (glass) {
      g.save(); g.translate(x + w - 52, y + 30); g.rotate(0.05);
      g.fillStyle = "#d8262c"; g.fillRect(-40, -14, 80, 28);
      g.fillStyle = "#fff"; g.font = "800 10px Arial, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      g.fillText("VORSICHT", 0, -5); g.fillText("GLAS", 0, 6);
      g.restore();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 });
  mat.userData.regions = R; mat.userData.size = S;
  boxMats.set(k, mat);
  return mat;
}
// All closed boxes are drawn as one instanced mesh: one draw call for the lot. Each
// label's texture is a tile of one atlas, chosen per instance in the shader.
const LABEL_TILES = 3;
function boxBatch(labels, count) {
  const S = 512, atlas = document.createElement("canvas"); atlas.width = atlas.height = S * LABEL_TILES;
  const g = atlas.getContext("2d"), tiles = new Map();
  labels.forEach((label, i) => {
    g.drawImage(boxMaterial(label).map.image, (i % LABEL_TILES) * S, Math.floor(i / LABEL_TILES) * S);
    tiles.set(label, i);
  });
  const map = new THREE.CanvasTexture(atlas); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  const material = new THREE.MeshStandardMaterial({ map, roughness: 0.85 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float tile;")
      .replace("#include <uv_vertex>", `#include <uv_vertex>\nvMapUv = (vMapUv + vec2(mod(tile, ${LABEL_TILES}.0), ${LABEL_TILES - 1}.0 - floor(tile / ${LABEL_TILES}.0))) / ${LABEL_TILES}.0;`);
  };
  const geometry = cardboardBox(labels[0]).children[0].geometry.clone(); // centred, like the item holders
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.geometry.setAttribute("tile", new THREE.InstancedBufferAttribute(new Float32Array(count), 1));
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.frustumCulled = false; // instances move all over the scene
  return { mesh, tile: (label) => tiles.get(label) ?? 0 };
}

function cardboardBox(label) {
  const mat = boxMaterial(label), { regions: R, size: S } = mat.userData;
  const geo = new THREE.BoxGeometry(BOX_SIZE.x, BOX_SIZE.y, BOX_SIZE.z), uv = geo.attributes.uv;
  // Faces +x, −x, +y, −y, +z, −z, each mapped onto its part of the atlas.
  const faceRegion = [R.side, R.side, R.top, R.bottom, R.end, R.end];
  for (let f = 0; f < 6; f++) {
    const [rx, ry, rw, rh] = faceRegion[f];
    for (let v = 0; v < 4; v++) { const i = f * 4 + v; uv.setXY(i, (rx + uv.getX(i) * rw) / S, 1 - (ry + (1 - uv.getY(i)) * rh) / S); }
  }
  const m = new THREE.Mesh(geo, mat); m.position.y = BOX_SIZE.y / 2; m.castShadow = m.receiveShadow = true;
  const wrap = new THREE.Group(); wrap.add(m); wrap.userData.size = BOX_SIZE.clone();
  return wrap;
}

// A rug rolled up for the move and stood on end: woven pattern on the outside, the
// spiral of the roll on the ends, two bands of packing tape round it.
let rugMats = null;
function rugRoll() {
  if (!rugMats) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#8c3b2e"; g.fillRect(0, 0, 512, 256);
    const rows = ["#e8dcc4", "#2f3f5c", "#c99a4b", "#e8dcc4", "#5c2620"];
    for (let y = 0; y < 256; y += 32) {
      g.fillStyle = rows[(y / 32) % rows.length]; g.fillRect(0, y + 10, 512, 6);
      for (let x = (y / 32) % 2 ? 16 : 0; x < 512; x += 32) { g.beginPath(); g.moveTo(x, y + 13); g.lineTo(x + 8, y + 5); g.lineTo(x + 16, y + 13); g.lineTo(x + 8, y + 21); g.closePath(); g.fill(); }
    }
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${i % 3 ? 255 : 0},${i % 3 ? 240 : 0},${i % 3 ? 220 : 0},0.05)`; g.fillRect((i * 37) % 512, (i * 71) % 256, 2, 1); }
    const side = new THREE.CanvasTexture(c); side.colorSpace = THREE.SRGBColorSpace; side.wrapS = THREE.RepeatWrapping; side.repeat.set(2, 3); side.anisotropy = 8;
    const e = document.createElement("canvas"); e.width = e.height = 128;
    const h = e.getContext("2d"); h.fillStyle = "#cfc2a8"; h.fillRect(0, 0, 128, 128);
    h.strokeStyle = "rgba(90,40,30,0.75)"; h.lineWidth = 2.2; h.beginPath();
    for (let a = 0; a < Math.PI * 2 * 9; a += 0.05) { const r = 6 + a * 1.0; h.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
    h.stroke();
    const end = new THREE.CanvasTexture(e); end.colorSpace = THREE.SRGBColorSpace;
    rugMats = [new THREE.MeshStandardMaterial({ map: side, roughness: 0.95 }), new THREE.MeshStandardMaterial({ map: end, roughness: 0.95 }), new THREE.MeshStandardMaterial({ color: "#c9a46c", roughness: 0.45 })];
  }
  const r = 0.13, len = 1.7, g = new THREE.Group();
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 40), [rugMats[0], rugMats[1], rugMats[1]]);
  roll.position.y = len / 2; g.add(roll);
  for (const y of [0.35, 1.35]) { const band = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.003, r + 0.003, 0.05, 40, 1, true), rugMats[2]); band.position.y = y; g.add(band); }
  g.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = true; });
  g.userData.size = V(2 * r, len, 2 * r);
  return g;
}

// A modern art print on paper: a terracotta sun over sage and teal shapes, thin line.
function artPrint() {
  const c = document.createElement("canvas"); c.width = 384; c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#efe8dc"; g.fillRect(0, 0, 384, 512);
  g.fillStyle = "#c2603f"; g.beginPath(); g.arc(214, 190, 88, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#8fa28c"; g.beginPath(); g.moveTo(40, 470); g.quadraticCurveTo(120, 250, 250, 330); g.quadraticCurveTo(320, 370, 344, 470); g.closePath(); g.fill();
  g.fillStyle = "#2f5f63"; g.beginPath(); g.moveTo(40, 470); g.quadraticCurveTo(170, 360, 344, 430); g.lineTo(344, 470); g.closePath(); g.fill();
  g.strokeStyle = "#1d1d1d"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(70, 120); g.bezierCurveTo(140, 60, 220, 330, 330, 260); g.stroke();
  for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(80,60,40,${0.03 + (i % 5) * 0.006})`; g.fillRect((i * 53) % 384, (i * 97) % 512, 1, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false; t.anisotropy = 4;
  return t;
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
  const wrap = new THREE.Group(); wrap.add(bakeColours(g));
  wrap.userData.size = V(w, h + 0.06, d);
  return wrap;
}

// The average colour of a texture (sampled down to 16 × 16), times the material colour.
const averages = new Map();
function averageColour(material) {
  const colour = material.color?.clone() ?? new THREE.Color(1, 1, 1), image = material.map?.image;
  if (!image) return colour;
  if (!averages.has(image)) {
    const c = document.createElement("canvas"); c.width = c.height = 16;
    const g = c.getContext("2d"); g.drawImage(image, 0, 0, 16, 16);
    const px = g.getImageData(0, 0, 16, 16).data, sum = [0, 0, 0];
    for (let i = 0; i < px.length; i += 4) for (let k = 0; k < 3; k++) sum[k] += px[i + k];
    averages.set(image, new THREE.Color().setRGB(sum[0] / 65280, sum[1] / 65280, sum[2] / 65280, THREE.SRGBColorSpace));
  }
  return colour.multiply(averages.get(image));
}

// Bakes a group into a single mesh with vertex colours (each part in its material's
// average colour; parts that have vertex colours keep them): one draw call instead
// of one per part. For small things where texture detail is lost on screen anyway.
const bakedMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
function bakeColours(root) {
  root.updateMatrixWorld(true);
  const toRoot = root.matrixWorld.clone().invert(), parts = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = [o.material].flat(), base = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    const groups = Array.isArray(o.material) && base.groups.length ? base.groups : [{ start: 0, count: base.attributes.position.count, materialIndex: 0 }];
    const own = base.attributes.color;
    // Plain floats (compressed models store normalised integers), then into the root's frame.
    const float = (a) => { const out = new Float32Array(a.count * 3); for (let i = 0; i < a.count; i++) for (let c = 0; c < 3; c++) out[i * 3 + c] = a.getComponent(i, c); return new THREE.BufferAttribute(out, 3); };
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", float(base.attributes.position));
    if (base.attributes.normal && !mats.some((m) => m.flatShading)) geo.setAttribute("normal", float(base.attributes.normal));
    geo.applyMatrix4(o.matrixWorld.clone().premultiply(toRoot));
    if (!geo.attributes.normal) geo.computeVertexNormals(); // flat: no shared vertices
    const colours = new Float32Array(base.attributes.position.count * 3);
    for (const grp of groups) {
      const c = averageColour(mats[grp.materialIndex ?? 0]);
      for (let v = grp.start; v < Math.min(grp.start + grp.count, base.attributes.position.count); v++) {
        if (own) colours.set([own.getX(v), own.getY(v), own.getZ(v)], v * 3); else colours.set([c.r, c.g, c.b], v * 3);
      }
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    parts.push(geo);
  });
  const mesh = new THREE.Mesh(mergeGeometries(parts), bakedMaterial);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
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
  const procedural = new Set([BOX, RUG, "books"]), ids = new Set();
  for (const c of CONTENTS) if (!c.m.startsWith("openbox") && !procedural.has(c.m)) ids.add(c.m);
  for (const list of Object.values(PACKED)) for (const [id] of list) if (!procedural.has(id)) ids.add(id);
  const models = Object.fromEntries(await Promise.all([...ids].map(async (id) => [id, await model(id, { texSize: mobile ? 256 : 512 })])));
  // One of the frames ships with a placeholder card; give it a print.
  models.hanging_picture_frame_01?.traverse((o) => { if (o.isMesh && /artwork/i.test(o.material.name)) o.material.map = artPrint(); });
  const used = new Set();
  const byKey = new Map();
  const items = CONTENTS.map((c) => {
    let src;
    if (c.m.startsWith("openbox:")) src = openBox(models, PACKED[c.m.split(":")[1]], V(0.39, 0.34, 0.52));
    else if (c.m === BOX) { src = new THREE.Group(); src.userData.size = BOX_SIZE.clone(); src.userData.label = LABELS[c.key.replace(/\d+$/, "")]; } // drawn by the box batch
    else if (c.m === RUG) src = rugRoll();
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
  // The closed boxes: one instanced mesh, each instance following its holder.
  const boxed = items.filter((it) => it.c.m === BOX);
  const labels = [...new Set(boxed.map((it) => it.o.children[0].userData.label))];
  const batch = boxBatch(labels, boxed.length);
  boxed.forEach((it, i) => batch.mesh.geometry.attributes.tile.setX(i, batch.tile(it.o.children[0].userData.label)));
  scene.add(batch.mesh);
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  const syncBoxes = () => {
    boxed.forEach((it, i) => { it.o.updateMatrix(); batch.mesh.setMatrixAt(i, it.o.visible ? it.o.matrix : hidden); });
    batch.mesh.instanceMatrix.needsUpdate = true;
  };

  // Home poses; pieces standing on others take their height from them.
  const baseOf = (it) => (it.c.on ? baseOf(byKey.get(it.c.on)) + byKey.get(it.c.on).size.y : it.c.y);
  for (const it of items) {
    const base = baseOf(it);
    it.home = { pos: V(it.c.x, base + it.size.y / 2, it.c.z), quat: qYaw(it.c.r) };
    if (!it.below) { // stacked boxes: what's directly underneath
      it.below = items.find((o) => o !== it && !o.c.on && Math.hypot(o.c.x - it.c.x, o.c.z - it.c.z) < 0.1 && Math.abs(baseOf(o) + o.size.y - base) < 0.03)?.key;
    }
  }

  // Where a picture hung, the paint behind it stayed brighter, and the nail is left.
  const ghost = new THREE.MeshStandardMaterial({ color: "#fcfbf8", roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -1 });
  const nail = new THREE.MeshStandardMaterial({ color: "#8e9092", metalness: 0.8, roughness: 0.4 });
  for (const it of items) if (it.c.m.startsWith("hanging_picture_frame")) {
    const onLeft = it.c.x < ROOM.x0 + 0.1, { x, y } = it.size, g = new THREE.Group();
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(x - 0.012, y - 0.012), ghost); mark.receiveShadow = true; g.add(mark);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.025, 6), nail); pin.rotation.x = Math.PI / 2; pin.position.set(0, y / 2 - 0.07, 0.012); g.add(pin);
    g.position.set(onLeft ? ROOM.x0 + 0.0015 : it.home.pos.x, it.home.pos.y, onLeft ? it.home.pos.z : ROOM.z0 + 0.0015);
    g.rotation.y = onLeft ? Q : 0; scene.add(g);
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

  // ---------- Van: parked by the room's open side, rear and tail lift turned to it ----------
  // Laptops: to the right of the room, turned half a radian off its line, so the camera
  // sees into the open rear and along the side with the livery. Phones: behind and to
  // the right of the room, rear towards the camera and the room, nose a little to the
  // right so its lit side shows; that keeps the pair narrow enough for a phone and
  // shows the loading straight into the back.
  const layout = mobile ? { rear: V(2.2, 0, -1.5), yaw: Math.PI - 0.15 } : { rear: V(2.6, 0, -1.0), yaw: Q + 0.5 };
  const fwd = V(Math.sin(layout.yaw), 0, Math.cos(layout.yaw)), right = V(-fwd.z, 0, fwd.x);
  const parked = { pos: layout.rear.clone().addScaledVector(fwd, -T.rear), yaw: layout.yaw };
  truck.root.position.copy(parked.pos); truck.root.rotation.y = parked.yaw; scene.add(truck.root);
  truck.root.add(contactShadow(2.7, 9.9, 0, 1.65, 0.55)); // travels with the truck
  truck.root.updateMatrixWorld(true);
  const toWorld = (p) => truck.root.localToWorld(p.clone());

  // ---------- Flight paths (world, van parked) ----------
  const n = items.length, stagger = (TL.fly1 - TL.fly0 - TL.flight) / (n - 1);
  items.forEach((it, i) => {
    it.t0 = TL.fly0 + i * stagger;
    const p0 = it.home.pos, h = it.size.y;
    const p4 = toWorld(it.slot.pos);
    const p3 = toWorld(V(it.slot.pos.x, it.slot.pos.y + 0.2, T.rear - 1.5));
    // Through the middle of the rear opening, then straight along the cargo space.
    const pIn = it.slot.pos.z > T.rear + 0.7 ? toWorld(V(it.slot.pos.x, it.slot.pos.y + 0.06, T.rear + 0.25)) : null;
    // Up off its place, then over what still stands in the room (box stacks, chairs),
    // out through the open side and across to the tail.
    const travel = Math.max(p0.y + 0.35, F + 1.25 + h / 2, p3.y + 0.3);
    const p1 = p0.clone().add(V(0, Math.min(0.5, travel - p0.y), 0.15));
    const p2 = V(ROOM.x1 + 0.45, travel, THREE.MathUtils.lerp(p0.z, p3.z, 0.5));
    it.curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, ...(pIn ? [pIn] : []), p4], false, "centripetal");
    it.curve.arcLengthDivisions = 400;
    it.curve.getLength();
    it.p3 = p3; it.p4 = p4;
    it.roll = (i % 2 ? 1 : -1) * 0.06;
  });

  // ---------- Departure: gathering speed out of the frame ----------
  // A short way ahead, then a right turn, so the van leaves sideways and low in the
  // frame instead of driving up behind the copy: an easy bend on laptops, a quarter
  // turn on phones.
  const FWD = 45, drivePos = V(0, 0, 0), heading = V(0, 0, 0);
  const turn = mobile ? { s0: 0.4, R: 5.5, ang: Q } : { s0: 1.0, R: 9, ang: 0.8 };
  const steerMax = -Math.atan(T.frontAxle / turn.R), arc = turn.R * turn.ang;
  function truckPose(t) {
    const u = span(t, ...TL.drive), s = FWD * u * u, { s0, R, ang } = turn;
    if (s <= s0) return { pos: drivePos.copy(parked.pos).addScaledVector(fwd, s), yaw: parked.yaw, dist: s, steer: 0 };
    // Round a centre to the right of where the turn starts, then straight on.
    const a = Math.min(s - s0, arc) / R, after = Math.max(0, s - s0 - arc);
    heading.copy(fwd).multiplyScalar(Math.cos(a)).addScaledVector(right, Math.sin(a));
    drivePos.copy(parked.pos).addScaledVector(fwd, s0 + R * Math.sin(a)).addScaledVector(right, R * (1 - Math.cos(a))).addScaledVector(heading, after);
    const steer = steerMax * clamp01((s - s0 + 0.6) / 0.6) * clamp01((s0 + arc + 0.6 - s) / 0.6);
    return { pos: drivePos, yaw: parked.yaw - a, dist: s, steer };
  }

  // ---------- Camera ----------
  // A slow, continuous move like a filmed shot, from above and in front like a model
  // on a table: the room and the van stay whole in the frame while it is loaded and
  // shut, then the view settles on the empty room as the van leaves. One path for each
  // layout, each composed for a 30° lens on a band of its own aspect (2.4:1 on laptops,
  // 1.38:1 on phones); on any other band the view is fitted to it (lens and fit, below).
  // Keys: look-at point, distance, azimuth (0 = straight from the front) and elevation.
  const key = (t, look, dist, az, el) => ({ t, look, pos: look.clone().add(V(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist)) });
  const paths = {
    wide: { aspect: 2.4, keys: [
      key(0, V(2.1, 0.9, -1.9), 15.8, 0, 0.55),
      key(0.36, V(2.0, 0.9, -1.9), 15.4, 0.03, 0.56),
      key(0.72, V(1.9, 0.9, -2.0), 15.1, 0.05, 0.57),
      key(0.8, V(2.3, 1.0, -2.1), 14.7, 0.04, 0.55),
      key(0.88, V(2.2, 1.0, -2.2), 15.1, 0, 0.55),
      key(1, V(-2.8, 0.9, -1.8), 11.0, -0.05, 0.6),
    ] },
    // Phones: the room and van centred with about 6 % of the width to spare either side
    // (measured on screen), then the empty room on its own. While the van leaves (it
    // drives away from the camera, then turns right), the view pulls back so the van
    // stays whole until it turns away, and below the copy.
    narrow: { aspect: 1.38, keys: [
      key(0, V(-1.6, 1.2, -3.3), 18.8, 0.14, 0.6),
      key(0.72, V(-1.7, 1.2, -3.3), 18.35, 0.12, 0.61),
      key(0.8, V(-1.55, 1.3, -3.1), 18.65, 0.16, 0.58),
      key(0.88, V(-1.7, 1.4, -4.2), 20.6, 0.14, 0.58),
      key(0.94, V(0.6, 1.2, -4.0), 26.1, 0.1, 0.6),
      key(1, V(-3.2, 0.9, -1.8), 13.5, 0.05, 0.62),
    ] },
  };
  const path = mobile ? paths.narrow : paths.wide;
  const halfTan = Math.tan(THREE.MathUtils.degToRad(15));
  // The lens for a band of this aspect. Laptops: 30° (38° on squarer bands), and the
  // camera backs off until the composed view fits (fit, below). Phones keep the composed
  // viewpoint and widen the lens instead: backing off changes the perspective, and with
  // it the framing, so this way every phone sees the same picture, only cropped taller
  // or shorter.
  const lens = (aspect) => mobile
    ? 2 * THREE.MathUtils.radToDeg(Math.atan(halfTan * Math.max(1, path.aspect / aspect)))
    : aspect < 1.3 ? 38 : 30;

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
    const shut = t >= TL.door[1];
    for (const it of items) {
      const u = clamp01((t - it.t0) / TL.flight), o = it.o;
      // Loaded pieces drop out of the drawing once the rear doors are shut.
      o.visible = u < 1 || !shut;
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
    syncBoxes();

    // Camera, fitted to the band
    spline(path.keys, t, "pos", camera.position); spline(path.keys, t, "look", look);
    const fit = (halfTan / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) * Math.max(1, path.aspect / camera.aspect);
    camera.position.sub(look).multiplyScalar(fit).add(look);
    camera.lookAt(look);
    return { cleared: t >= TL.cleared };
  }

  return { evaluate, lens, items, slots, plan };
}
